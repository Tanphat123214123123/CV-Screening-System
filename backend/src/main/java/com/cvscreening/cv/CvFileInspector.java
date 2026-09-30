package com.cvscreening.cv;

import com.cvscreening.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.zip.ZipException;
import java.util.zip.ZipFile;

/**
 * Kiem tra file CV bang NOI DUNG that, khong chi duoi file.
 *
 * Truoc day chi xem duoi: doi ten virus.exe -> virus.pdf la qua; file 0 byte cung qua; .doc duoc nhan
 * nhung AI worker (python-docx) khong doc duoc .doc nen chac chan FAILED.
 */
public final class CvFileInspector {

    /** PDF hop le co header "%PDF-" o dau file (cho phep toi da 1 KB rac phia truoc nhu Acrobat). */
    private static final byte[] PDF_MAGIC = "%PDF-".getBytes(StandardCharsets.US_ASCII);
    private static final int PDF_HEADER_SEARCH_BYTES = 1024;
    /** DOCX la file ZIP: bat dau bang local file header "PK\3\4". */
    private static final byte[] ZIP_MAGIC = {'P', 'K', 3, 4};

    private CvFileInspector() {
    }

    public enum CvFileType {
        PDF("pdf", "application/pdf"),
        DOCX("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        private final String extension;
        private final String contentType;

        CvFileType(String extension, String contentType) {
            this.extension = extension;
            this.contentType = contentType;
        }

        public String extension() {
            return extension;
        }

        /** Content-type an toan de luu tren S3 (khong lay tu client). */
        public String contentType() {
            return contentType;
        }
    }

    public static CvFileType inspect(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw badRequest("File CV rỗng, vui lòng chọn file khác.");
        }
        String extension = extensionOf(file.getOriginalFilename());
        CvFileType type = switch (extension) {
            case "pdf" -> CvFileType.PDF;
            case "docx" -> CvFileType.DOCX;
            case "doc" -> throw badRequest(
                    "File .doc (Word 97-2003) chưa được hỗ trợ. Hãy lưu lại dưới dạng .docx hoặc PDF.");
            default -> throw badRequest("Chỉ chấp nhận file PDF hoặc Word (.pdf, .docx).");
        };
        boolean contentMatches = switch (type) {
            case PDF -> looksLikePdf(file);
            case DOCX -> looksLikeDocx(file);
        };
        if (!contentMatches) {
            throw badRequest("Nội dung file không đúng định dạng " + extension.toUpperCase(Locale.ROOT)
                    + " (file hỏng hoặc bị đổi đuôi).");
        }
        return type;
    }

    static String extensionOf(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot + 1).trim().toLowerCase(Locale.ROOT);
    }

    private static boolean looksLikePdf(MultipartFile file) {
        byte[] head = readHead(file, PDF_HEADER_SEARCH_BYTES);
        return indexOf(head, PDF_MAGIC) >= 0;
    }

    /**
     * Header ZIP + co entry word/document.xml (dau hieu cua van ban Word, phan biet voi file ZIP khac).
     * Dung ZipFile tren file tam: doc muc luc (central directory) ma KHONG giai nen noi dung,
     * nen mot "zip bomb" nho khong the lam no RAM/CPU trong buoc kiem tra nay.
     */
    private static boolean looksLikeDocx(MultipartFile file) {
        if (!Arrays.equals(readHead(file, ZIP_MAGIC.length), ZIP_MAGIC)) {
            return false;
        }
        Path temp = null;
        try {
            temp = Files.createTempFile("cv-inspect-", ".docx");
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, temp, StandardCopyOption.REPLACE_EXISTING);
            }
            try (ZipFile zip = new ZipFile(temp.toFile())) {
                return zip.getEntry("word/document.xml") != null
                        && zip.getEntry("[Content_Types].xml") != null;
            }
        } catch (ZipException e) {
            return false;
        } catch (IOException e) {
            throw new UncheckedIOException("Không đọc được file upload", e);
        } finally {
            if (temp != null) {
                try {
                    Files.deleteIfExists(temp);
                } catch (IOException ignored) {
                    // file tam trong thu muc temp cua he dieu hanh, khong anh huong ket qua
                }
            }
        }
    }

    private static byte[] readHead(MultipartFile file, int maxBytes) {
        try (InputStream in = file.getInputStream()) {
            return in.readNBytes(maxBytes);
        } catch (IOException e) {
            throw new UncheckedIOException("Không đọc được file upload", e);
        }
    }

    private static int indexOf(byte[] data, byte[] pattern) {
        outer:
        for (int i = 0; i <= data.length - pattern.length; i++) {
            for (int j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) {
                    continue outer;
                }
            }
            return i;
        }
        return -1;
    }

    private static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }
}

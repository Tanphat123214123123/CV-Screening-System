package com.cvscreening.cv;

import java.text.Normalizer;

/**
 * Xu ly ten file do client gui len.
 *
 * Truoc day: s3Key = "cvs/" + UUID + "-" + ten goc. Ten dai hon ~214 ky tu lam key vuot varchar(255)
 * -> loi DB bi hieu nham thanh "da nop CV roi" (409) va de lai file mo coi tren S3.
 */
final class CvFileNames {

    /** Phan ten file dua vao S3 key: "cvs/" (4) + UUID (36) + "-" (1) + toi da 100 -> ~141 ky tu. */
    private static final int MAX_KEY_PART_LENGTH = 100;

    private CvFileNames() {
    }

    /**
     * Ten hien thi luu trong DB: bo duong dan (mot so trinh duyet gui "C:\fakepath\cv.pdf"), bo ky tu
     * dieu khien, cat con toi da 255 ky tu nhung GIU phan duoi.
     */
    static String displayName(String originalName, String extension) {
        String name = originalName == null ? "" : originalName;
        name = name.substring(Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')) + 1);
        name = name.replaceAll("\\p{Cntrl}", "").trim();
        if (name.isEmpty() || name.equals("." + extension)) {
            name = "cv." + extension;
        }
        return truncateKeepingExtension(name, Cv.MAX_FILE_NAME_LENGTH, extension);
    }

    /** Phan ten an toan cho S3 key: bo dau tieng Viet, chi giu [a-zA-Z0-9._-], gioi han do dai. */
    static String keyPart(String displayName, String extension) {
        String ascii = Normalizer.normalize(displayName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .replaceAll("[^a-zA-Z0-9._-]", "_");
        return truncateKeepingExtension(ascii, MAX_KEY_PART_LENGTH, extension);
    }

    private static String truncateKeepingExtension(String name, int maxLength, String extension) {
        if (name.length() <= maxLength) {
            return name;
        }
        String suffix = "." + extension;
        String base = name.toLowerCase().endsWith(suffix) ? name.substring(0, name.length() - suffix.length()) : name;
        return base.substring(0, maxLength - suffix.length()) + suffix;
    }
}

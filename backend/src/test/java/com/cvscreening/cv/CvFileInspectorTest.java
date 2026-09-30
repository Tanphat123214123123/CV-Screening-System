package com.cvscreening.cv;

import com.cvscreening.TestFiles;
import com.cvscreening.cv.CvFileInspector.CvFileType;
import com.cvscreening.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class CvFileInspectorTest {

    @Test
    void pdfHopLe() {
        assertEquals(CvFileType.PDF, CvFileInspector.inspect(TestFiles.pdf("CV.PDF")));
    }

    @Test
    void pdfCoRacTruocHeader_vanChapNhan() {
        byte[] withJunk = ("\n\n  " + new String(TestFiles.pdfBytes(), StandardCharsets.US_ASCII))
                .getBytes(StandardCharsets.US_ASCII);
        var file = new MockMultipartFile("file", "cv.pdf", "application/pdf", withJunk);

        assertEquals(CvFileType.PDF, CvFileInspector.inspect(file));
    }

    @Test
    void docxHopLe() {
        assertEquals(CvFileType.DOCX, CvFileInspector.inspect(TestFiles.docx("cv.docx")));
    }

    @Test
    void zipKhongPhaiWord_doiDuoiDocx_biTuChoi() {
        var zip = new MockMultipartFile("file", "cv.docx", "application/zip", TestFiles.zip("readme.txt"));

        assertThrows(ApiException.class, () -> CvFileInspector.inspect(zip));
    }

    @Test
    void zipHongChiCoHeader_biTuChoi() {
        var broken = new MockMultipartFile("file", "cv.docx", null, new byte[]{'P', 'K', 3, 4, 1, 2, 3});

        assertThrows(ApiException.class, () -> CvFileInspector.inspect(broken));
    }

    @Test
    void pdfDoiDuoiThanhDocx_biTuChoi() {
        var file = new MockMultipartFile("file", "cv.docx", null, TestFiles.pdfBytes());

        assertThrows(ApiException.class, () -> CvFileInspector.inspect(file));
    }

    @Test
    void khongCoDuoi_hoacDuoiLa_biTuChoi() {
        assertThrows(ApiException.class,
                () -> CvFileInspector.inspect(new MockMultipartFile("file", "cv", null, TestFiles.pdfBytes())));
        assertThrows(ApiException.class,
                () -> CvFileInspector.inspect(new MockMultipartFile("file", "cv.txt", null, TestFiles.pdfBytes())));
    }

    @Test
    void fileNull_biTuChoi() {
        assertThrows(ApiException.class, () -> CvFileInspector.inspect(null));
    }
}

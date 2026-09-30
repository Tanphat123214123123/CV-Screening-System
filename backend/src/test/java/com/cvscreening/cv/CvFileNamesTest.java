package com.cvscreening.cv;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CvFileNamesTest {

    @Test
    void displayName_boDuongDan_vaKyTuDieuKhien() {
        assertEquals("cv.pdf", CvFileNames.displayName("C:\\fakepath\\cv.pdf", "pdf"));
        assertEquals("cv.pdf", CvFileNames.displayName("../../etc/cv.pdf", "pdf"));
        assertEquals("cv.pdf", CvFileNames.displayName("c\u0000v.pdf", "pdf"));
    }

    @Test
    void displayName_rong_dungTenMacDinh() {
        assertEquals("cv.pdf", CvFileNames.displayName(null, "pdf"));
        assertEquals("cv.docx", CvFileNames.displayName("   ", "docx"));
    }

    @Test
    void displayName_quaDai_catCon255_giuDuoi() {
        String name = CvFileNames.displayName("x".repeat(300) + ".docx", "docx");

        assertEquals(255, name.length());
        assertTrue(name.endsWith(".docx"));
    }

    @Test
    void displayName_giuTiengVietDeHienThi() {
        assertEquals("Nguyễn Văn Á.pdf", CvFileNames.displayName("Nguyễn Văn Á.pdf", "pdf"));
    }

    @Test
    void keyPart_boDau_chiGiuKyTuAnToan() {
        assertEquals("Nguyen_Van_A_CV_Dang.pdf", CvFileNames.keyPart("Nguyễn Văn Á CV Đặng.pdf", "pdf"));
        assertEquals("a_b_.pdf", CvFileNames.keyPart("a/b?.pdf", "pdf"));
    }

    @Test
    void keyPart_gioiHan100KyTu() {
        String part = CvFileNames.keyPart("y".repeat(250) + ".pdf", "pdf");

        assertEquals(100, part.length());
        assertTrue(part.endsWith(".pdf"));
    }
}

package com.cvscreening.cv;

import com.cvscreening.TestFiles;
import com.cvscreening.exception.ApiException;
import com.cvscreening.exception.DbConstraints;
import com.cvscreening.infrastructure.S3Service;
import com.cvscreening.job.Job;
import com.cvscreening.job.JobRepository;
import com.cvscreening.matching.MatchResultRepository;
import com.cvscreening.outbox.OutboxService;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.SQLException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Unit test cho luong upload CV, tai CV va xet duyet ho so. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CvServiceTest {

    private static final Instant NOW = Instant.parse("2026-09-30T08:00:00Z");

    @Mock private CvRepository cvRepository;
    @Mock private JobRepository jobRepository;
    @Mock private MatchResultRepository matchResultRepository;
    @Mock private S3Service s3Service;
    @Mock private OutboxService outboxService;
    @Mock private TransactionTemplate transactionTemplate;

    private CvService cvService;
    private User candidate;
    private Job job;

    @BeforeEach
    void setUp() {
        cvService = new CvService(cvRepository, jobRepository, matchResultRepository, s3Service,
                outboxService, transactionTemplate, Clock.fixed(NOW, ZoneOffset.UTC));
        candidate = User.builder().id(1L).fullName("Ung Vien")
                .email("c@test.com").password("x").role(Role.CANDIDATE).build();
        job = Job.builder().id(10L).title("Java Dev").description("...")
                .requiredSkills("Java").createdBy(2L).active(true).build();

        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(cvRepository.existsByCandidateIdAndJobId(1L, 10L)).thenReturn(false);
        // TransactionTemplate that: chay callback ngay (khong can DB trong unit test)
        when(transactionTemplate.execute(any())).thenAnswer(inv ->
                inv.<TransactionCallback<?>>getArgument(0).doInTransaction(null));
        when(cvRepository.save(any(Cv.class))).thenAnswer(inv -> {
            Cv cv = inv.getArgument(0);
            cv.setId(99L);
            return cv;
        });
    }

    // ---------- upload: luong chinh ----------

    @Test
    void upload_hopLe_luuCv_ghiOutbox_uploadS3VoiContentTypeAnToan() {
        var response = cvService.upload(TestFiles.pdf("cv.pdf"), 10L, candidate);

        assertEquals(99L, response.cvId());
        assertEquals("PENDING", response.status());
        verify(s3Service).upload(startsWith("cvs/"), any(), eq("application/pdf"));
        // Message cho worker di qua outbox (cung transaction), KHONG gui SQS truc tiep
        var cvCaptor = ArgumentCaptor.forClass(Cv.class);
        verify(outboxService).enqueueCvProcessing(cvCaptor.capture());
        assertEquals(99L, cvCaptor.getValue().getId());
        verify(s3Service, never()).deleteQuietly(any());
    }

    @Test
    void upload_docx_contentTypeWord() {
        cvService.upload(TestFiles.docx("cv.docx"), 10L, candidate);

        verify(s3Service).upload(endsWith(".docx"), any(),
                eq("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    }

    // ---------- upload: validate file (truoc khi dung toi S3) ----------

    @Test
    void upload_exeDoiDuoiThanhPdf_bao400_khongUploadS3() {
        var fake = new MockMultipartFile("file", "virus.pdf", "application/pdf", new byte[]{'M', 'Z', 0, 0});

        var ex = assertThrows(ApiException.class, () -> cvService.upload(fake, 10L, candidate));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verifyNoInteractions(s3Service, outboxService);
    }

    @Test
    void upload_fileRong_bao400() {
        var empty = new MockMultipartFile("file", "cv.pdf", "application/pdf", new byte[0]);

        var ex = assertThrows(ApiException.class, () -> cvService.upload(empty, 10L, candidate));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verifyNoInteractions(s3Service);
    }

    @Test
    void upload_fileDoc_bao400_vaGiaiThichLyDo() {
        var doc = new MockMultipartFile("file", "cv.doc", "application/msword", TestFiles.pdfBytes());

        var ex = assertThrows(ApiException.class, () -> cvService.upload(doc, 10L, candidate));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains(".docx"));
    }

    @Test
    void upload_tenFileRatDai_duocCatNgan_khongVuotCotDb() {
        String longName = "a".repeat(400) + ".pdf";

        cvService.upload(TestFiles.pdf(longName), 10L, candidate);

        var cvCaptor = ArgumentCaptor.forClass(Cv.class);
        verify(cvRepository).save(cvCaptor.capture());
        Cv saved = cvCaptor.getValue();
        assertTrue(saved.getFileName().length() <= 255);
        assertTrue(saved.getFileName().endsWith(".pdf"));
        assertTrue(saved.getS3Key().length() <= 255, "s3Key vuot varchar(255): " + saved.getS3Key().length());
    }

    // ---------- upload: nghiep vu ----------

    @Test
    void upload_tinDaDong_bao404() {
        job.setActive(false);

        var ex = assertThrows(ApiException.class, () -> cvService.upload(TestFiles.pdf("cv.pdf"), 10L, candidate));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verifyNoInteractions(s3Service);
    }

    @Test
    void upload_daNopRoi_bao409_khongUploadS3() {
        when(cvRepository.existsByCandidateIdAndJobId(1L, 10L)).thenReturn(true);

        var ex = assertThrows(ApiException.class, () -> cvService.upload(TestFiles.pdf("cv.pdf"), 10L, candidate));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verifyNoInteractions(s3Service);
    }

    // ---------- upload: loi sau khi file da len S3 -> luon don file ----------

    @Test
    void upload_haiRequestCungLuc_constraintTrung_bao409_vaXoaFileS3() {
        when(cvRepository.save(any(Cv.class))).thenThrow(integrityViolation(DbConstraints.UK_CVS_CANDIDATE_JOB));

        var ex = assertThrows(ApiException.class, () -> cvService.upload(TestFiles.pdf("cv.pdf"), 10L, candidate));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(s3Service).deleteQuietly(startsWith("cvs/"));
    }

    @Test
    void upload_loiDbKhac_KHONG_bao409_nemNguyenLoi_vaXoaFileS3() {
        var otherError = integrityViolation("ck_cvs_status");
        when(cvRepository.save(any(Cv.class))).thenThrow(otherError);

        var ex = assertThrows(DataIntegrityViolationException.class,
                () -> cvService.upload(TestFiles.pdf("cv.pdf"), 10L, candidate));

        assertSame(otherError, ex);
        verify(s3Service).deleteQuietly(startsWith("cvs/"));
    }

    @Test
    void upload_ghiOutboxLoi_xoaFileS3() {
        doThrow(new IllegalStateException("db down")).when(outboxService).enqueueCvProcessing(any());

        assertThrows(IllegalStateException.class, () -> cvService.upload(TestFiles.pdf("cv.pdf"), 10L, candidate));

        verify(s3Service).deleteQuietly(startsWith("cvs/"));
    }

    // ---------- tai CV ----------

    @Test
    void getDownloadUrl_hrTaoTinNay_choPhepTai() {
        Cv cv = cv(CvStatus.PROCESSED);
        User hrChuTin = User.builder().id(job.getCreatedBy()).role(Role.HR).build();
        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv));
        when(s3Service.presignDownloadUrl("cvs/x.pdf")).thenReturn("https://signed-url");

        assertEquals("https://signed-url", cvService.getDownloadUrl(5L, hrChuTin));
    }

    @Test
    void getDownloadUrl_hrKhacKhongTaoTinNay_bao403() {
        User hrKhac = User.builder().id(999L).role(Role.HR).build();
        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv(CvStatus.PROCESSED)));

        var ex = assertThrows(ApiException.class, () -> cvService.getDownloadUrl(5L, hrKhac));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verifyNoInteractions(s3Service);
    }

    // ---------- xet duyet ho so ----------

    @Test
    void updateReviewStatus_hrChuTin_luuTrangThai_vaAudit() {
        Cv cv = cv(CvStatus.PROCESSED);
        User hrChuTin = User.builder().id(job.getCreatedBy()).role(Role.HR).build();
        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv));

        cvService.updateReviewStatus(5L, ReviewStatus.SHORTLISTED, hrChuTin);

        assertEquals(ReviewStatus.SHORTLISTED, cv.getReviewStatus());
        assertEquals(hrChuTin.getId(), cv.getReviewedBy());
        assertEquals(NOW, cv.getReviewedAt());
    }

    @Test
    void updateReviewStatus_shortlistCvChuaCham_bao409() {
        Cv cv = cv(CvStatus.PENDING);
        User hrChuTin = User.builder().id(job.getCreatedBy()).role(Role.HR).build();
        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv));

        var ex = assertThrows(ApiException.class,
                () -> cvService.updateReviewStatus(5L, ReviewStatus.SHORTLISTED, hrChuTin));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals(ReviewStatus.NEW, cv.getReviewStatus());
    }

    @Test
    void updateReviewStatus_tuChoiCvLoi_duocPhep() {
        Cv cv = cv(CvStatus.FAILED);
        User hrChuTin = User.builder().id(job.getCreatedBy()).role(Role.HR).build();
        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv));

        cvService.updateReviewStatus(5L, ReviewStatus.REJECTED, hrChuTin);

        assertEquals(ReviewStatus.REJECTED, cv.getReviewStatus());
    }

    @Test
    void updateReviewStatus_hrKhac_bao403() {
        Cv cv = cv(CvStatus.PROCESSED);
        User hrKhac = User.builder().id(999L).role(Role.HR).build();
        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv));

        var ex = assertThrows(ApiException.class,
                () -> cvService.updateReviewStatus(5L, ReviewStatus.REJECTED, hrKhac));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals(ReviewStatus.NEW, cv.getReviewStatus());
        assertNull(cv.getReviewedAt());
    }

    private Cv cv(CvStatus status) {
        return Cv.builder().id(5L).fileName("cv.pdf").s3Key("cvs/x.pdf").status(status)
                .candidateId(candidate.getId()).jobId(job.getId()).build();
    }

    /** Mo phong dung chuoi exception Spring Data tra ve khi PostgreSQL bao vi pham constraint. */
    static DataIntegrityViolationException integrityViolation(String constraintName) {
        var sql = new SQLException("violates constraint " + constraintName, "23505");
        return new DataIntegrityViolationException("could not execute statement",
                new ConstraintViolationException("could not execute statement", sql, constraintName));
    }
}

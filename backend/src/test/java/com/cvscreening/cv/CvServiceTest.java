package com.cvscreening.cv;

import com.cvscreening.exception.ApiException;
import com.cvscreening.infrastructure.S3Service;
import com.cvscreening.infrastructure.SqsService;
import com.cvscreening.job.Job;
import com.cvscreening.job.JobRepository;
import com.cvscreening.matching.MatchResultRepository;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Unit test cho luong upload CV. */
@ExtendWith(MockitoExtension.class)
class CvServiceTest {

    @Mock private CvRepository cvRepository;
    @Mock private JobRepository jobRepository;
    @Mock private MatchResultRepository matchResultRepository;
    @Mock private S3Service s3Service;
    @Mock private SqsService sqsService;

    @InjectMocks private CvService cvService;

    private User candidate;
    private Job job;

    @BeforeEach
    void setUp() {
        candidate = User.builder().id(1L).fullName("Ung Vien")
                .email("c@test.com").password("x").role(Role.CANDIDATE).build();
        job = Job.builder().id(10L).title("Java Dev").description("...")
                .requiredSkills("Java").createdBy(2L).active(true).build();
    }

    @Test
    void upload_hopLe_luuCvVaGuiQueue() {
        var file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "noi dung".getBytes());
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(cvRepository.findByCandidateIdAndJobId(1L, 10L)).thenReturn(Optional.empty());
        when(cvRepository.save(any(Cv.class))).thenAnswer(inv -> {
            Cv cv = inv.getArgument(0);
            cv.setId(99L);
            return cv;
        });

        var response = cvService.upload(file, 10L, candidate);

        assertEquals(99L, response.cvId());
        assertEquals("PENDING", response.status());
        verify(s3Service).upload(anyString(), eq(file));
        verify(sqsService).sendCvProcessingMessage(eq(99L), eq(10L), anyString(), eq("cv.pdf"));
    }

    @Test
    void upload_saiDinhDang_bao400() {
        var file = new MockMultipartFile("file", "virus.exe", "application/octet-stream", new byte[]{1});
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(cvRepository.findByCandidateIdAndJobId(1L, 10L)).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> cvService.upload(file, 10L, candidate));
        verifyNoInteractions(s3Service, sqsService);
    }

    @Test
    void getDownloadUrl_hrTaoTinNay_choPhepTai() {
        Cv cv = Cv.builder().id(5L).fileName("cv.pdf").s3Key("cvs/x.pdf")
                .candidateId(candidate.getId()).jobId(job.getId()).build();
        User hrChuTin = User.builder().id(job.getCreatedBy()).role(Role.HR).build();
        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv));
        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
        when(s3Service.presignDownloadUrl("cvs/x.pdf")).thenReturn("https://signed-url");

        assertEquals("https://signed-url", cvService.getDownloadUrl(5L, hrChuTin));
    }

    @Test
    void getDownloadUrl_hrKhacKhongTaoTinNay_bao403() {
        Cv cv = Cv.builder().id(5L).fileName("cv.pdf").s3Key("cvs/x.pdf")
                .candidateId(candidate.getId()).jobId(job.getId()).build();
        // HR nay khong phai nguoi tao ra tin (job.createdBy = 2L)
        User hrKhac = User.builder().id(999L).role(Role.HR).build();
        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv));
        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));

        assertThrows(ApiException.class, () -> cvService.getDownloadUrl(5L, hrKhac));
        verifyNoInteractions(s3Service);
    }
}

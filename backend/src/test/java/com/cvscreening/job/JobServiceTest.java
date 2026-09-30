package com.cvscreening.job;

import com.cvscreening.cv.Cv;
import com.cvscreening.cv.CvRepository;
import com.cvscreening.cv.CvStatus;
import com.cvscreening.cv.ReviewStatus;
import com.cvscreening.exception.ApiException;
import com.cvscreening.matching.MatchResult;
import com.cvscreening.matching.MatchResultRepository;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Unit test cho danh sach tin cua HR (kem so lieu) va dong/mo lai tin. */
@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock private JobRepository jobRepository;
    @Mock private CvRepository cvRepository;
    @Mock private MatchResultRepository matchResultRepository;

    @InjectMocks private JobService jobService;

    private User hr;
    private Job job;

    @BeforeEach
    void setUp() {
        hr = User.builder().id(2L).fullName("HR").email("hr@test.com").password("x").role(Role.HR).build();
        job = Job.builder().id(10L).title("Java Dev").description("...")
                .requiredSkills("Java").createdBy(2L).active(false).build();
    }

    private Cv cv(long id, CvStatus status, ReviewStatus review) {
        return Cv.builder().id(id).fileName("cv.pdf").s3Key("k").candidateId(id)
                .jobId(10L).status(status).reviewStatus(review).build();
    }

    private MatchResult result(long cvId, double score) {
        return MatchResult.builder().cvId(cvId).jobId(10L).score(score).build();
    }

    @Test
    void getJobsOf_tinhSoLieuUngVien_vaGomCaTinDaDong() {
        when(jobRepository.findByCreatedByOrderByCreatedAtDesc(2L)).thenReturn(List.of(job));
        when(cvRepository.findByJobIdIn(List.of(10L))).thenReturn(List.of(
                cv(1, CvStatus.PROCESSED, ReviewStatus.SHORTLISTED),
                cv(2, CvStatus.PROCESSED, ReviewStatus.NEW),
                cv(3, CvStatus.PENDING, null)));
        when(matchResultRepository.findByCvIdIn(anyCollection()))
                .thenReturn(List.of(result(1, 85), result(2, 40)));

        var jobs = jobService.getJobsOf(hr);

        assertEquals(1, jobs.size());
        var stats = jobs.get(0);
        assertFalse(stats.active());
        assertEquals(3, stats.applicantCount());
        assertEquals(1, stats.pendingCount());
        assertEquals(1, stats.strongCount());
        assertEquals(1, stats.shortlistedCount());
        assertEquals(62.5, stats.averageScore());
    }

    @Test
    void getJobsOf_chuaCoCv_diemTrungBinhNull() {
        when(jobRepository.findByCreatedByOrderByCreatedAtDesc(2L)).thenReturn(List.of(job));
        when(cvRepository.findByJobIdIn(List.of(10L))).thenReturn(List.of());
        when(matchResultRepository.findByCvIdIn(anyCollection())).thenReturn(List.of());

        var stats = jobService.getJobsOf(hr).get(0);

        assertEquals(0, stats.applicantCount());
        assertNull(stats.averageScore());
    }

    @Test
    void reopen_boiChuTin_batLaiActive() {
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        jobService.reopen(10L, hr);

        assertTrue(job.getActive());
        verify(jobRepository).save(job);
    }

    @Test
    void reopen_boiHrKhac_bi403() {
        User otherHr = User.builder().id(3L).fullName("HR B").email("b@test.com")
                .password("x").role(Role.HR).build();
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        assertThrows(ApiException.class, () -> jobService.reopen(10L, otherHr));
        verify(jobRepository, never()).save(any());
    }
}

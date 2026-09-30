package com.cvscreening.matching;

import com.cvscreening.cv.Cv;
import com.cvscreening.cv.CvRepository;
import com.cvscreening.cv.CvStatus;
import com.cvscreening.exception.ApiException;
import com.cvscreening.job.Job;
import com.cvscreening.job.JobRepository;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import com.cvscreening.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock private MatchResultRepository matchResultRepository;
    @Mock private CvRepository cvRepository;
    @Mock private UserRepository userRepository;
    @Mock private JobRepository jobRepository;

    @InjectMocks private MatchingService matchingService;

    private User hr;
    private Job job;

    @BeforeEach
    void setUp() {
        hr = User.builder().id(2L).role(Role.HR).build();
        job = Job.builder().id(10L).createdBy(2L).active(true).build();
    }

    @Test
    void xepHangTheoDiemGiamDan_cvChuaChamXepCuoiTheoThoiGianNop() {
        Instant t = Instant.parse("2026-09-01T00:00:00Z");
        var cvs = List.of(
                cv(1, 101, CvStatus.PENDING, t.plusSeconds(30)),
                cv(2, 102, CvStatus.PROCESSED, t.plusSeconds(20)),
                cv(3, 103, CvStatus.PROCESSED, t.plusSeconds(10)),
                cv(4, 104, CvStatus.FAILED, t));
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(cvRepository.findByJobIdOrderByUploadedAtDesc(10L)).thenReturn(cvs);
        when(matchResultRepository.findByJobId(10L)).thenReturn(List.of(result(2, 55.0), result(3, 90.0)));
        when(userRepository.findAllById(anyCollection())).thenReturn(List.of(
                user(101), user(102), user(103), user(104)));

        var ranked = matchingService.getCandidatesForJob(10L, hr);

        assertEquals(List.of(3L, 2L, 4L, 1L), ranked.stream().map(r -> r.cvId()).toList());
        assertEquals(90.0, ranked.get(0).score());
        assertNull(ranked.get(2).score());
        assertEquals("NEW", ranked.get(0).reviewStatus());
        assertEquals("Ung vien 103", ranked.get(0).candidateName());
    }

    @Test
    void hrKhongTaoTin_bao403() {
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        User otherHr = User.builder().id(9L).role(Role.HR).build();

        var ex = assertThrows(ApiException.class, () -> matchingService.getCandidatesForJob(10L, otherHr));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verifyNoInteractions(cvRepository);
    }

    @Test
    void tinKhongTonTai_bao404() {
        when(jobRepository.findById(10L)).thenReturn(Optional.empty());

        var ex = assertThrows(ApiException.class, () -> matchingService.getCandidatesForJob(10L, hr));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    private static Cv cv(long id, long candidateId, CvStatus status, Instant uploadedAt) {
        return Cv.builder().id(id).candidateId(candidateId).jobId(10L).status(status)
                .fileName("cv.pdf").s3Key("k").uploadedAt(uploadedAt).build();
    }

    private static MatchResult result(long cvId, double score) {
        return MatchResult.builder().cvId(cvId).jobId(10L).score(score).build();
    }

    private static User user(long id) {
        return User.builder().id(id).fullName("Ung vien " + id).email(id + "@x.com").role(Role.CANDIDATE).build();
    }
}

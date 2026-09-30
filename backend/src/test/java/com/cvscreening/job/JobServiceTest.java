package com.cvscreening.job;

import com.cvscreening.cv.Cv;
import com.cvscreening.cv.CvRepository;
import com.cvscreening.cv.CvRepository.JobApplicantStats;
import com.cvscreening.cv.CvStatus;
import com.cvscreening.exception.ApiException;
import com.cvscreening.job.JobDtos.JobRequest;
import com.cvscreening.matching.MatchResultRepository;
import com.cvscreening.outbox.OutboxService;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Unit test cho tin tuyen dung: so lieu dashboard, xem tin, cap nhat + cham lai, dong/mo tin. */
@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock private JobRepository jobRepository;
    @Mock private CvRepository cvRepository;
    @Mock private MatchResultRepository matchResultRepository;
    @Mock private OutboxService outboxService;

    @InjectMocks private JobService jobService;

    private User hr;
    private User otherHr;
    private User candidate;
    private Job job;

    @BeforeEach
    void setUp() {
        hr = User.builder().id(2L).fullName("HR").email("hr@test.com").password("x").role(Role.HR).build();
        otherHr = User.builder().id(3L).fullName("HR B").email("b@test.com").password("x").role(Role.HR).build();
        candidate = User.builder().id(7L).fullName("UV").email("c@test.com").password("x").role(Role.CANDIDATE).build();
        job = Job.builder().id(10L).title("Java Dev").description("Mo ta")
                .requiredSkills("Java").location("HCM").createdBy(2L).active(true).build();
    }

    record Stats(Long getJobId, Long getApplicantCount, Long getPendingCount, Long getStrongCount,
                 Long getShortlistedCount, Double getAverageScore) implements JobApplicantStats {}

    // ---------- dashboard ----------

    @Test
    void getJobsOf_laySoLieuTuTruyVanTongHop_vaLamTronDiemTrungBinh() {
        job.setActive(false);
        when(jobRepository.findByCreatedByOrderByCreatedAtDesc(2L)).thenReturn(List.of(job));
        when(cvRepository.aggregateStatsByJob(List.of(10L), JobService.STRONG_SCORE))
                .thenReturn(List.of(new Stats(10L, 3L, 1L, 1L, 1L, 62.4567)));

        var stats = jobService.getJobsOf(hr).get(0);

        assertFalse(stats.active());
        assertEquals(3, stats.applicantCount());
        assertEquals(1, stats.pendingCount());
        assertEquals(1, stats.strongCount());
        assertEquals(1, stats.shortlistedCount());
        assertEquals(62.5, stats.averageScore());
    }

    @Test
    void getJobsOf_tinChuaCoCv_soLieuBang0_diemTrungBinhNull() {
        when(jobRepository.findByCreatedByOrderByCreatedAtDesc(2L)).thenReturn(List.of(job));
        when(cvRepository.aggregateStatsByJob(anyCollection(), anyDouble())).thenReturn(List.of());

        var stats = jobService.getJobsOf(hr).get(0);

        assertEquals(0, stats.applicantCount());
        assertNull(stats.averageScore());
    }

    @Test
    void getJobsOf_chuaCoTin_khongTruyVanThongKe() {
        when(jobRepository.findByCreatedByOrderByCreatedAtDesc(2L)).thenReturn(List.of());

        assertTrue(jobService.getJobsOf(hr).isEmpty());
        verifyNoInteractions(cvRepository);
    }

    // ---------- xem chi tiet ----------

    @Test
    void getById_tinDaDong_nguoiKhac_bao404() {
        job.setActive(false);
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ApiException.class, () -> jobService.getById(10L, candidate)).getStatus());
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ApiException.class, () -> jobService.getById(10L, otherHr)).getStatus());
    }

    @Test
    void getById_tinDaDong_hrChuTin_vanXemDuoc() {
        job.setActive(false);
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        assertEquals(10L, jobService.getById(10L, hr).id());
    }

    @Test
    void getById_tinDangMo_aiCungXemDuoc() {
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        assertEquals(10L, jobService.getById(10L, candidate).id());
    }

    // ---------- cap nhat + cham lai ----------

    @Test
    void update_doiKyNangYeuCau_xoaKetQuaCu_vaDuaTatCaCvVeHangCho() {
        Cv processed = Cv.builder().id(1L).jobId(10L).status(CvStatus.PROCESSED).build();
        Cv failed = Cv.builder().id(2L).jobId(10L).status(CvStatus.FAILED).build();
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(cvRepository.findByJobIdOrderByUploadedAtDesc(10L)).thenReturn(List.of(processed, failed));

        jobService.update(10L, new JobRequest("Java Dev", "Mo ta", "Java, Docker", "HCM"), hr);

        assertEquals("Java, Docker", job.getRequiredSkills());
        verify(matchResultRepository).deleteByJobId(10L);
        assertEquals(CvStatus.PENDING, processed.getStatus());
        assertEquals(CvStatus.PENDING, failed.getStatus());
        verify(outboxService).enqueueCvProcessing(processed);
        verify(outboxService).enqueueCvProcessing(failed);
    }

    @Test
    void update_chiDoiDiaDiem_khongChamLai() {
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        jobService.update(10L, new JobRequest(" Java Dev ", "Mo ta", "Java", "Ha Noi"), hr);

        assertEquals("Ha Noi", job.getLocation());
        verifyNoInteractions(matchResultRepository, outboxService);
        verify(cvRepository, never()).findByJobIdOrderByUploadedAtDesc(any());
    }

    @Test
    void update_boiHrKhac_bao403_khongDoiGi() {
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        assertThrows(ApiException.class,
                () -> jobService.update(10L, new JobRequest("Hack", "x", "y", null), otherHr));
        assertEquals("Java Dev", job.getTitle());
    }

    @Test
    void create_trimDuLieu_diaDiemRongThanhNull() {
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        var created = jobService.create(new JobRequest("  Dev  ", " Mo ta ", " Java ", "   "), hr);

        assertEquals("Dev", created.title());
        assertEquals("Java", created.requiredSkills());
        assertNull(created.location());
    }

    // ---------- dong / mo tin ----------

    @Test
    void reopen_boiChuTin_batLaiActive() {
        job.setActive(false);
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        jobService.reopen(10L, hr);

        assertTrue(job.getActive());
    }

    @Test
    void deactivate_boiHrKhac_bi403() {
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        assertThrows(ApiException.class, () -> jobService.deactivate(10L, otherHr));
        assertTrue(job.getActive());
    }
}

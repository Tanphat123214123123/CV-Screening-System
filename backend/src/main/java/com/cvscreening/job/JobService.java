package com.cvscreening.job;

import com.cvscreening.cv.Cv;
import com.cvscreening.cv.CvRepository;
import com.cvscreening.cv.CvRepository.JobApplicantStats;
import com.cvscreening.exception.ApiException;
import com.cvscreening.job.JobDtos.JobRequest;
import com.cvscreening.job.JobDtos.JobResponse;
import com.cvscreening.job.JobDtos.MyJobResponse;
import com.cvscreening.matching.MatchResultRepository;
import com.cvscreening.outbox.OutboxService;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    /** Nguong diem de tinh la ung vien "phu hop cao" tren dashboard. */
    static final double STRONG_SCORE = 70.0;

    private final JobRepository jobRepository;
    private final CvRepository cvRepository;
    private final MatchResultRepository matchResultRepository;
    private final OutboxService outboxService;

    @Transactional(readOnly = true)
    public List<JobResponse> getActiveJobs() {
        return jobRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream().map(JobResponse::from).toList();
    }

    /** Tat ca tin do HR nay tao (ca tin da dong), kem so lieu ung vien tinh bang SQL (GROUP BY). */
    @Transactional(readOnly = true)
    public List<MyJobResponse> getJobsOf(User hr) {
        List<Job> jobs = jobRepository.findByCreatedByOrderByCreatedAtDesc(hr.getId());
        if (jobs.isEmpty()) return List.of();

        Map<Long, JobApplicantStats> statsByJob = cvRepository
                .aggregateStatsByJob(jobs.stream().map(Job::getId).toList(), STRONG_SCORE).stream()
                .collect(Collectors.toMap(JobApplicantStats::getJobId, Function.identity()));

        return jobs.stream().map(job -> {
            JobApplicantStats stats = statsByJob.get(job.getId());
            return new MyJobResponse(
                    job.getId(), job.getTitle(), job.getDescription(), job.getRequiredSkills(),
                    job.getLocation(), job.getActive(), job.getCreatedAt(),
                    stats == null ? 0 : toInt(stats.getApplicantCount()),
                    stats == null ? 0 : toInt(stats.getPendingCount()),
                    stats == null ? 0 : toInt(stats.getStrongCount()),
                    stats == null ? 0 : toInt(stats.getShortlistedCount()),
                    stats == null || stats.getAverageScore() == null ? null
                            : Math.round(stats.getAverageScore() * 10) / 10.0);
        }).toList();
    }

    /**
     * Tin da dong chi con chinh HR tao tin xem duoc; nguoi khac nhan 404 nhu tin khong ton tai
     * (truoc day ai dang nhap cung xem duoc tin da dong qua /api/jobs/{id}).
     */
    @Transactional(readOnly = true)
    public JobResponse getById(Long id, User viewer) {
        Job job = findJob(id);
        boolean isOwner = viewer.getRole() == Role.HR && job.getCreatedBy().equals(viewer.getId());
        if (!Boolean.TRUE.equals(job.getActive()) && !isOwner) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng.");
        }
        return JobResponse.from(job);
    }

    @Transactional
    public JobResponse create(JobRequest request, User hr) {
        Job job = Job.builder()
                .title(request.title().trim())
                .description(request.description().trim())
                .requiredSkills(request.requiredSkills().trim())
                .location(blankToNull(request.location()))
                .createdBy(hr.getId())
                .build();
        return JobResponse.from(jobRepository.save(job));
    }

    /**
     * Cap nhat tin. Neu doi noi dung AI dung de cham (tieu de, mo ta, ky nang) thi CHAM LAI toan bo CV
     * cua tin: xoa ket qua cu, dua CV ve PENDING, ghi outbox — cung mot transaction. Truoc day diem cu
     * giu nguyen nen bang xep hang tron lan diem cham theo nhieu phien ban JD khac nhau.
     */
    @Transactional
    public JobResponse update(Long id, JobRequest request, User hr) {
        Job job = findJob(id);
        checkOwner(job, hr);

        String title = request.title().trim();
        String description = request.description().trim();
        String requiredSkills = request.requiredSkills().trim();
        boolean scoringInputsChanged = !Objects.equals(job.getTitle(), title)
                || !Objects.equals(job.getDescription(), description)
                || !Objects.equals(job.getRequiredSkills(), requiredSkills);

        job.setTitle(title);
        job.setDescription(description);
        job.setRequiredSkills(requiredSkills);
        job.setLocation(blankToNull(request.location()));

        if (scoringInputsChanged) {
            rescoreApplicants(job);
        }
        return JobResponse.from(job);
    }

    @Transactional
    public void deactivate(Long id, User hr) {
        setActive(id, hr, false);
    }

    @Transactional
    public void reopen(Long id, User hr) {
        setActive(id, hr, true);
    }

    private void rescoreApplicants(Job job) {
        List<Cv> cvs = cvRepository.findByJobIdOrderByUploadedAtDesc(job.getId());
        if (cvs.isEmpty()) return;
        matchResultRepository.deleteByJobId(job.getId());
        for (Cv cv : cvs) {
            cv.requeueForScoring();
            outboxService.enqueueCvProcessing(cv);
        }
        log.info("JD của tin #{} thay đổi -> chấm lại {} CV", job.getId(), cvs.size());
    }

    private void setActive(Long id, User hr, boolean active) {
        Job job = findJob(id);
        checkOwner(job, hr);
        job.setActive(active);
    }

    private Job findJob(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng."));
    }

    private void checkOwner(Job job, User hr) {
        if (!job.getCreatedBy().equals(hr.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không phải người tạo tin này.");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static int toInt(Long value) {
        return value == null ? 0 : Math.toIntExact(value);
    }
}

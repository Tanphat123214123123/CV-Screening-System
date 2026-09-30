package com.cvscreening.job;

import com.cvscreening.cv.Cv;
import com.cvscreening.cv.CvRepository;
import com.cvscreening.cv.CvStatus;
import com.cvscreening.cv.ReviewStatus;
import com.cvscreening.exception.ApiException;
import com.cvscreening.job.JobDtos.JobRequest;
import com.cvscreening.job.JobDtos.JobResponse;
import com.cvscreening.job.JobDtos.MyJobResponse;
import com.cvscreening.matching.MatchResult;
import com.cvscreening.matching.MatchResultRepository;
import com.cvscreening.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    /** Nguong diem de tinh la ung vien "phu hop cao" tren dashboard. */
    private static final double STRONG_SCORE = 70.0;

    private final JobRepository jobRepository;
    private final CvRepository cvRepository;
    private final MatchResultRepository matchResultRepository;

    public List<JobResponse> getActiveJobs() {
        return jobRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream().map(JobResponse::from).toList();
    }

    /** Tat ca tin do HR nay tao (ca tin da dong), kem so lieu ung vien cua tung tin. */
    public List<MyJobResponse> getJobsOf(User hr) {
        List<Job> jobs = jobRepository.findByCreatedByOrderByCreatedAtDesc(hr.getId());
        if (jobs.isEmpty()) return List.of();

        Map<Long, List<Cv>> cvsByJob = cvRepository
                .findByJobIdIn(jobs.stream().map(Job::getId).toList()).stream()
                .collect(Collectors.groupingBy(Cv::getJobId));
        Map<Long, Double> scoreByCvId = matchResultRepository
                .findByCvIdIn(cvsByJob.values().stream().flatMap(List::stream).map(Cv::getId).toList())
                .stream()
                .collect(Collectors.toMap(MatchResult::getCvId, MatchResult::getScore));

        return jobs.stream().map(job -> {
            List<Cv> cvs = cvsByJob.getOrDefault(job.getId(), List.of());
            List<Double> scores = cvs.stream()
                    .map(cv -> scoreByCvId.get(cv.getId()))
                    .filter(s -> s != null)
                    .toList();
            Double average = scores.isEmpty() ? null
                    : Math.round(scores.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10) / 10.0;
            return new MyJobResponse(
                    job.getId(), job.getTitle(), job.getDescription(), job.getRequiredSkills(),
                    job.getLocation(), job.getActive(), job.getCreatedAt(),
                    cvs.size(),
                    (int) cvs.stream().filter(cv -> cv.getStatus() == CvStatus.PENDING).count(),
                    (int) scores.stream().filter(s -> s >= STRONG_SCORE).count(),
                    (int) cvs.stream().filter(cv -> cv.getReviewStatus() == ReviewStatus.SHORTLISTED).count(),
                    average);
        }).toList();
    }

    public JobResponse getById(Long id) {
        return JobResponse.from(findJob(id));
    }

    @Transactional
    public JobResponse create(JobRequest request, User hr) {
        Job job = Job.builder()
                .title(request.title())
                .description(request.description())
                .requiredSkills(request.requiredSkills())
                .location(request.location())
                .createdBy(hr.getId())
                .build();
        return JobResponse.from(jobRepository.save(job));
    }

    @Transactional
    public JobResponse update(Long id, JobRequest request, User hr) {
        Job job = findJob(id);
        checkOwner(job, hr);
        job.setTitle(request.title());
        job.setDescription(request.description());
        job.setRequiredSkills(request.requiredSkills());
        job.setLocation(request.location());
        return JobResponse.from(jobRepository.save(job));
    }

    @Transactional
    public void deactivate(Long id, User hr) {
        setActive(id, hr, false);
    }

    @Transactional
    public void reopen(Long id, User hr) {
        setActive(id, hr, true);
    }

    private void setActive(Long id, User hr, boolean active) {
        Job job = findJob(id);
        checkOwner(job, hr);
        job.setActive(active);
        jobRepository.save(job);
    }

    private Job findJob(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Khong tim thay tin tuyen dung"));
    }

    private void checkOwner(Job job, User hr) {
        if (!job.getCreatedBy().equals(hr.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Ban khong phai nguoi tao tin nay");
        }
    }
}

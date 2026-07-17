package com.cvscreening.job;

import com.cvscreening.exception.ApiException;
import com.cvscreening.job.JobDtos.JobRequest;
import com.cvscreening.job.JobDtos.JobResponse;
import com.cvscreening.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;

    public List<JobResponse> getActiveJobs() {
        return jobRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream().map(JobResponse::from).toList();
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
        Job job = findJob(id);
        checkOwner(job, hr);
        job.setActive(false);
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

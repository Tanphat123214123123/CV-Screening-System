package com.cvscreening.job;

import com.cvscreening.job.JobDtos.JobRequest;
import com.cvscreening.job.JobDtos.JobResponse;
import com.cvscreening.job.JobDtos.MyJobResponse;
import com.cvscreening.user.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Quản lý tin tuyển dụng")
public class JobController {

    private final JobService jobService;

    @GetMapping
    @Operation(summary = "Danh sách tin tuyển dụng đang mở (HR + ứng viên đều xem được)")
    public List<JobResponse> getActiveJobs() {
        return jobService.getActiveJobs();
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Tin tuyển dụng do HR hiện tại tạo (cả tin đã đóng), kèm số liệu ứng viên")
    public List<MyJobResponse> getMyJobs(@AuthenticationPrincipal AppUserDetails me) {
        return jobService.getJobsOf(me.user());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết một tin tuyển dụng (tin đã đóng chỉ HR tạo tin xem được)")
    public JobResponse getById(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails me) {
        return jobService.getById(id, me.user());
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Tạo tin tuyển dụng mới (chỉ HR)")
    public ResponseEntity<JobResponse> create(@Valid @RequestBody JobRequest request,
                                              @AuthenticationPrincipal AppUserDetails me) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.create(request, me.user()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Cập nhật tin (chỉ HR tạo tin). Đổi tiêu đề/mô tả/kỹ năng sẽ chấm lại toàn bộ CV.")
    public JobResponse update(@PathVariable Long id,
                              @Valid @RequestBody JobRequest request,
                              @AuthenticationPrincipal AppUserDetails me) {
        return jobService.update(id, request, me.user());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Đóng tin tuyển dụng (soft delete)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails me) {
        jobService.deactivate(id, me.user());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Mở lại tin tuyển dụng đã đóng")
    public ResponseEntity<Void> reopen(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails me) {
        jobService.reopen(id, me.user());
        return ResponseEntity.noContent().build();
    }
}

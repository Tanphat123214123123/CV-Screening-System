package com.cvscreening.job;

import com.cvscreening.job.JobDtos.JobRequest;
import com.cvscreening.job.JobDtos.JobResponse;
import com.cvscreening.user.User;
import com.cvscreening.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Quan ly tin tuyen dung")
public class JobController {

    private final JobService jobService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Danh sach tin tuyen dung dang mo (HR + ung vien deu xem duoc)")
    public List<JobResponse> getActiveJobs() {
        return jobService.getActiveJobs();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiet mot tin tuyen dung")
    public JobResponse getById(@PathVariable Long id) {
        return jobService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Tao tin tuyen dung moi (chi HR)")
    public ResponseEntity<JobResponse> create(@Valid @RequestBody JobRequest request,
                                              Authentication auth) {
        User hr = userService.getByEmail(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.create(request, hr));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Cap nhat tin tuyen dung (chi HR tao tin)")
    public JobResponse update(@PathVariable Long id,
                              @Valid @RequestBody JobRequest request,
                              Authentication auth) {
        User hr = userService.getByEmail(auth.getName());
        return jobService.update(id, request, hr);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Dong tin tuyen dung (soft delete)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id, Authentication auth) {
        User hr = userService.getByEmail(auth.getName());
        jobService.deactivate(id, hr);
        return ResponseEntity.noContent().build();
    }
}

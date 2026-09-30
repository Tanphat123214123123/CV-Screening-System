package com.cvscreening.cv;

import com.cvscreening.cv.CvDtos.CvUploadResponse;
import com.cvscreening.cv.CvDtos.DownloadUrlResponse;
import com.cvscreening.cv.CvDtos.MyApplicationResponse;
import com.cvscreening.cv.CvDtos.ReviewStatusRequest;
import com.cvscreening.user.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
@Tag(name = "CV", description = "Nộp và quản lý CV")
public class CvController {

    private final CvService cvService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Ứng viên nộp CV (PDF/DOCX) cho một tin tuyển dụng")
    public ResponseEntity<CvUploadResponse> upload(@RequestParam("file") MultipartFile file,
                                                   @RequestParam("jobId") Long jobId,
                                                   @AuthenticationPrincipal AppUserDetails me) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(cvService.upload(file, jobId, me.user()));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Danh sách đơn ứng tuyển của ứng viên hiện tại")
    public List<MyApplicationResponse> myApplications(@AuthenticationPrincipal AppUserDetails me) {
        return cvService.getMyApplications(me.user());
    }

    @PatchMapping("/{id}/review-status")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "HR đánh dấu hồ sơ: NEW / SHORTLISTED / REJECTED")
    public ResponseEntity<Void> updateReviewStatus(@PathVariable Long id,
                                                   @Valid @RequestBody ReviewStatusRequest request,
                                                   @AuthenticationPrincipal AppUserDetails me) {
        cvService.updateReviewStatus(id, request.status(), me.user());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Lấy presigned URL để tải file CV (HR chủ tin hoặc chính chủ)")
    public DownloadUrlResponse download(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails me) {
        return new DownloadUrlResponse(cvService.getDownloadUrl(id, me.user()));
    }
}

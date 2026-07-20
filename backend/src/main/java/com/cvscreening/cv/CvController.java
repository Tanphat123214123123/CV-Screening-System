package com.cvscreening.cv;

import com.cvscreening.cv.CvDtos.CvUploadResponse;
import com.cvscreening.cv.CvDtos.DownloadUrlResponse;
import com.cvscreening.cv.CvDtos.MyApplicationResponse;
import com.cvscreening.user.User;
import com.cvscreening.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
@Tag(name = "CV", description = "Nop va quan ly CV")
public class CvController {

    private final CvService cvService;
    private final UserService userService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Ung vien nop CV (PDF/DOCX) cho mot tin tuyen dung")
    public ResponseEntity<CvUploadResponse> upload(@RequestParam("file") MultipartFile file,
                                                   @RequestParam("jobId") Long jobId,
                                                   Authentication auth) {
        User candidate = userService.getByEmail(auth.getName());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(cvService.upload(file, jobId, candidate));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Danh sach don ung tuyen cua ung vien hien tai")
    public List<MyApplicationResponse> myApplications(Authentication auth) {
        User candidate = userService.getByEmail(auth.getName());
        return cvService.getMyApplications(candidate);
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Lay presigned URL de tai file CV (HR hoac chinh chu)")
    public DownloadUrlResponse download(@PathVariable Long id, Authentication auth) {
        User requester = userService.getByEmail(auth.getName());
        return new DownloadUrlResponse(cvService.getDownloadUrl(id, requester));
    }
}

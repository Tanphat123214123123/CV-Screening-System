package com.cvscreening.cv;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class CvDtos {

    public record CvUploadResponse(Long cvId, String fileName, String status, String message) {}

    /** reviewStatus: ung vien biet ho so da duoc HR shortlist / tu choi hay chua. */
    public record MyApplicationResponse(
            Long cvId, Long jobId, String jobTitle, String fileName,
            String status, String reviewStatus, Double score, String matchedSkills, String missingSkills,
            Instant uploadedAt
    ) {}

    public record DownloadUrlResponse(String url) {}

    public record ReviewStatusRequest(@NotNull(message = "Trạng thái không được để trống.") ReviewStatus status) {}
}

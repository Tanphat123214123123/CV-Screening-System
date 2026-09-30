package com.cvscreening.cv;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class CvDtos {

    public record CvUploadResponse(Long cvId, String fileName, String status, String message) {}

    public record MyApplicationResponse(
            Long cvId, Long jobId, String jobTitle, String fileName,
            String status, Double score, String matchedSkills, String missingSkills,
            Instant uploadedAt
    ) {}

    public record DownloadUrlResponse(String url) {}

    public record ReviewStatusRequest(@NotNull(message = "Trang thai khong duoc de trong") ReviewStatus status) {}
}

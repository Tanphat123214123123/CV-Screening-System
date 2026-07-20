package com.cvscreening.cv;

import java.time.Instant;

public class CvDtos {

    public record CvUploadResponse(Long cvId, String fileName, String status, String message) {}

    public record MyApplicationResponse(
            Long cvId, Long jobId, String jobTitle, String fileName,
            String status, Double score, Instant uploadedAt
    ) {}

    public record DownloadUrlResponse(String url) {}
}

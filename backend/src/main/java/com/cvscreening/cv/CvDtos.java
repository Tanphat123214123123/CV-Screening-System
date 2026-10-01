package com.cvscreening.cv;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class CvDtos {

    public record CvUploadResponse(Long cvId, String fileName, String status, String message) {}

    /**
     * reviewStatus: ung vien biet ho so da duoc HR shortlist / tu choi hay chua.
     * fitLevel (HIGH / MEDIUM / LOW, null khi chua cham) thay cho diem so: xem FitLevel.
     */
    public record MyApplicationResponse(
            Long cvId, Long jobId, String jobTitle, String fileName,
            String status, String reviewStatus, String fitLevel, String matchedSkills, String missingSkills,
            Instant uploadedAt
    ) {}

    public record DownloadUrlResponse(String url) {}

    public record ReviewStatusRequest(@NotNull(message = "Trạng thái không được để trống.") ReviewStatus status) {}
}

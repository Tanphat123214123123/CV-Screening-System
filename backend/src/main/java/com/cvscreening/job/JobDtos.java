package com.cvscreening.job;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class JobDtos {

    /**
     * Gioi han do dai: title/location la varchar(255) trong DB (vuot qua truoc day thanh 500);
     * description/requiredSkills la TEXT nhung van phai chan tren de khong ai gui hang chuc MB.
     */
    public record JobRequest(
            @NotBlank(message = "Tiêu đề không được để trống.")
            @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự.")
            String title,

            @NotBlank(message = "Mô tả không được để trống.")
            @Size(max = 10_000, message = "Mô tả tối đa 10.000 ký tự.")
            String description,

            @NotBlank(message = "Kỹ năng yêu cầu không được để trống.")
            @Size(max = 1_000, message = "Kỹ năng yêu cầu tối đa 1.000 ký tự.")
            String requiredSkills,

            @Size(max = 200, message = "Địa điểm tối đa 200 ký tự.")
            String location
    ) {}

    public record JobResponse(
            Long id, String title, String description, String requiredSkills,
            String location, Boolean active, Instant createdAt
    ) {
        public static JobResponse from(Job job) {
            return new JobResponse(job.getId(), job.getTitle(), job.getDescription(),
                    job.getRequiredSkills(), job.getLocation(), job.getActive(), job.getCreatedAt());
        }
    }

    /** Tin tuyen dung cua HR kem so lieu ung vien de hien dashboard. */
    public record MyJobResponse(
            Long id, String title, String description, String requiredSkills,
            String location, Boolean active, Instant createdAt,
            int applicantCount,     // tong so CV da nop
            int pendingCount,       // CV AI chua xu ly xong
            int strongCount,        // CV dat >= 70 diem
            int shortlistedCount,   // CV HR da dua vao shortlist
            Double averageScore     // null neu chua co CV nao duoc cham
    ) {}
}

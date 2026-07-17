package com.cvscreening.job;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class JobDtos {

    public record JobRequest(
            @NotBlank(message = "Tieu de khong duoc de trong") String title,
            @NotBlank(message = "Mo ta khong duoc de trong") String description,
            @NotBlank(message = "Ky nang yeu cau khong duoc de trong") String requiredSkills,
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
}

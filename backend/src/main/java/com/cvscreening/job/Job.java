package com.cvscreening.job;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "jobs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** Danh sach ky nang yeu cau, phan cach boi dau phay. VD: "Java, Spring Boot, SQL" */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String requiredSkills;

    private String location;

    /** ID cua HR tao tin nay. */
    @Column(nullable = false)
    private Long createdBy;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}

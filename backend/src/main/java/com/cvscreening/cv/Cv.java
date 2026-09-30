package com.cvscreening.cv;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "cvs", uniqueConstraints = @UniqueConstraint(columnNames = {"candidate_id", "job_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Cv {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    /** Key cua file tren S3, vd: cvs/uuid-ten-file.pdf */
    @Column(nullable = false)
    private String s3Key;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private CvStatus status = CvStatus.PENDING;

    /**
     * Trang thai HR xu ly ho so. Cho phep null de ddl-auto them cot vao bang da co du lieu;
     * null duoc hieu la NEW (xem getReviewStatus).
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReviewStatus reviewStatus = ReviewStatus.NEW;

    @Column(nullable = false)
    private Long candidateId;

    @Column(nullable = false)
    private Long jobId;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();

    public ReviewStatus getReviewStatus() {
        return reviewStatus == null ? ReviewStatus.NEW : reviewStatus;
    }
}

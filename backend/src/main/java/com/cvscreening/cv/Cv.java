package com.cvscreening.cv;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Schema bang cvs do Flyway quan ly (db/migration). Ten constraint trong annotation chi de doc code,
 * nguon su that la file migration.
 */
@Entity
@Table(name = "cvs", uniqueConstraints = @UniqueConstraint(
        name = "uk_cvs_candidate_job", columnNames = {"candidate_id", "job_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Cv {

    /** Gioi han cot varchar(255). */
    public static final int MAX_FILE_NAME_LENGTH = 255;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ten file goc de hien thi (da cat con toi da 255 ky tu). */
    @Column(nullable = false, length = MAX_FILE_NAME_LENGTH)
    private String fileName;

    /** Key cua file tren S3, vd: cvs/uuid-ten-file.pdf */
    @Column(nullable = false)
    private String s3Key;

    /** Trang thai AI xu ly. */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private CvStatus status = CvStatus.PENDING;

    /** Trang thai HR xu ly ho so (doc lap voi status). */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private ReviewStatus reviewStatus = ReviewStatus.NEW;

    /** Audit: lan cuoi HR doi reviewStatus luc nao, boi ai (null = chua xet duyet). */
    private Instant reviewedAt;

    private Long reviewedBy;

    @Column(nullable = false)
    private Long candidateId;

    @Column(nullable = false)
    private Long jobId;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();

    /** Dua CV ve hang cho AI cham lai (JD thay doi). */
    public void requeueForScoring() {
        this.status = CvStatus.PENDING;
    }

    public void review(ReviewStatus newStatus, Long reviewerId, Instant at) {
        this.reviewStatus = newStatus;
        this.reviewedBy = reviewerId;
        this.reviewedAt = at;
    }
}

package com.cvscreening.matching;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Ket qua cham diem CV do AI Worker (Python) ghi vao database.
 * Backend chi doc va tra ve cho HR.
 */
@Entity
@Table(name = "match_results")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long cvId;

    @Column(nullable = false)
    private Long jobId;

    /** Diem phu hop 0-100. */
    @Column(nullable = false)
    private Double score;

    /** Ky nang trung khop, phan cach dau phay. */
    @Column(columnDefinition = "TEXT")
    private String matchedSkills;

    /** Ky nang JD yeu cau nhung CV thieu. */
    @Column(columnDefinition = "TEXT")
    private String missingSkills;

    /** Tom tat/nhan xet do AI sinh ra. */
    @Column(columnDefinition = "TEXT")
    private String summary;

    /** So nam kinh nghiem trich xuat duoc tu CV. */
    private Integer yearsExperience;

    @Column(nullable = false)
    private Instant createdAt;
}

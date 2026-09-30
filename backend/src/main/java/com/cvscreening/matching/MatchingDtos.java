package com.cvscreening.matching;

import java.time.Instant;

public class MatchingDtos {

    /** Mot dong trong bang review ung vien cua HR. */
    public record CandidateMatchResponse(
            Long cvId,
            String candidateName,
            String candidateEmail,
            String fileName,
            String status,          // PENDING / PROCESSED / FAILED
            String reviewStatus,    // NEW / SHORTLISTED / REJECTED (HR xu ly)
            Double score,           // null neu chua xu ly xong
            String matchedSkills,
            String missingSkills,
            String summary,
            Integer yearsExperience,
            Instant uploadedAt,
            Instant reviewedAt      // lan cuoi HR doi reviewStatus, null neu chua xet
    ) {}
}

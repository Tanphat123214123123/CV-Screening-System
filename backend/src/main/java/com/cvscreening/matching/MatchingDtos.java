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
            Double score,           // null neu chua xu ly xong
            String matchedSkills,
            String missingSkills,
            String summary,
            Integer yearsExperience,
            Instant uploadedAt
    ) {}
}

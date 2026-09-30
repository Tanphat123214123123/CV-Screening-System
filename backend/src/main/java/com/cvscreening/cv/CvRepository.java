package com.cvscreening.cv;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface CvRepository extends JpaRepository<Cv, Long> {
    List<Cv> findByJobIdOrderByUploadedAtDesc(Long jobId);
    List<Cv> findByCandidateIdOrderByUploadedAtDesc(Long candidateId);
    boolean existsByCandidateIdAndJobId(Long candidateId, Long jobId);

    /**
     * So lieu ung vien cua nhieu tin trong MOT cau SQL (GROUP BY). Truoc day tai TOAN BO CV + ket qua
     * cua moi tin vao RAM chi de dem. LEFT JOIN vi CV chua cham (PENDING/FAILED) chua co match_results;
     * uk_match_results_cv bao dam join 1-1 nen count khong bi nhan doi.
     */
    @Query("""
            select c.jobId as jobId,
                   count(c) as applicantCount,
                   sum(case when c.status = com.cvscreening.cv.CvStatus.PENDING then 1 else 0 end) as pendingCount,
                   sum(case when m.score >= :strongScore then 1 else 0 end) as strongCount,
                   sum(case when c.reviewStatus = com.cvscreening.cv.ReviewStatus.SHORTLISTED then 1 else 0 end)
                       as shortlistedCount,
                   avg(m.score) as averageScore
            from Cv c
            left join com.cvscreening.matching.MatchResult m on m.cvId = c.id
            where c.jobId in :jobIds
            group by c.jobId
            """)
    List<JobApplicantStats> aggregateStatsByJob(@Param("jobIds") Collection<Long> jobIds,
                                                @Param("strongScore") double strongScore);

    /** Projection cho aggregateStatsByJob. averageScore = null neu chua co CV nao duoc cham. */
    interface JobApplicantStats {
        Long getJobId();
        Long getApplicantCount();
        Long getPendingCount();
        Long getStrongCount();
        Long getShortlistedCount();
        Double getAverageScore();
    }
}

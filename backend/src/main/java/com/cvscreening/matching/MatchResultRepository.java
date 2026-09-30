package com.cvscreening.matching;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
    List<MatchResult> findByJobId(Long jobId);
    List<MatchResult> findByCvIdIn(Collection<Long> cvIds);

    /** Xoa ket qua cu cua mot tin khi JD thay doi (CV se duoc cham lai). */
    @Modifying
    @Query("delete from MatchResult m where m.jobId = :jobId")
    int deleteByJobId(@Param("jobId") Long jobId);
}

package com.cvscreening.matching;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
    Optional<MatchResult> findByCvId(Long cvId);
    List<MatchResult> findByJobId(Long jobId);
    List<MatchResult> findByCvIdIn(Collection<Long> cvIds);
}

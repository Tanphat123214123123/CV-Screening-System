package com.cvscreening.cv;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CvRepository extends JpaRepository<Cv, Long> {
    List<Cv> findByJobIdOrderByUploadedAtDesc(Long jobId);
    List<Cv> findByCandidateIdOrderByUploadedAtDesc(Long candidateId);
    List<Cv> findByJobIdIn(Collection<Long> jobIds);
    Optional<Cv> findByCandidateIdAndJobId(Long candidateId, Long jobId);
}

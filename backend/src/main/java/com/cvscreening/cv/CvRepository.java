package com.cvscreening.cv;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CvRepository extends JpaRepository<Cv, Long> {
    List<Cv> findByJobIdOrderByUploadedAtDesc(Long jobId);
    List<Cv> findByCandidateIdOrderByUploadedAtDesc(Long candidateId);
    Optional<Cv> findByCandidateIdAndJobId(Long candidateId, Long jobId);
}

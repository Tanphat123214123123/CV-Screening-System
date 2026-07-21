package com.cvscreening.matching;

import com.cvscreening.cv.Cv;
import com.cvscreening.cv.CvRepository;
import com.cvscreening.exception.ApiException;
import com.cvscreening.job.JobRepository;
import com.cvscreening.matching.MatchingDtos.CandidateMatchResponse;
import com.cvscreening.user.User;
import com.cvscreening.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final MatchResultRepository matchResultRepository;
    private final CvRepository cvRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    /**
     * Tra ve danh sach ung vien cua mot tin tuyen dung, sap xep theo diem giam dan.
     * CV chua xu ly xong (PENDING) van hien thi voi score = null.
     */
    public List<CandidateMatchResponse> getCandidatesForJob(Long jobId, User hr) {
        var job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Khong tim thay tin tuyen dung"));
        if (!job.getCreatedBy().equals(hr.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Ban khong phai nguoi tao tin nay");
        }

        List<Cv> cvs = cvRepository.findByJobIdOrderByUploadedAtDesc(jobId);
        Map<Long, MatchResult> resultsByCvId = matchResultRepository.findByJobId(jobId).stream()
                .collect(Collectors.toMap(MatchResult::getCvId, Function.identity()));
        Map<Long, User> candidatesById = userRepository
                .findAllById(cvs.stream().map(Cv::getCandidateId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return cvs.stream()
                .map(cv -> {
                    MatchResult result = resultsByCvId.get(cv.getId());
                    User candidate = candidatesById.get(cv.getCandidateId());
                    return new CandidateMatchResponse(
                            cv.getId(),
                            candidate != null ? candidate.getFullName() : "(khong xac dinh)",
                            candidate != null ? candidate.getEmail() : "",
                            cv.getFileName(),
                            cv.getStatus().name(),
                            result != null ? result.getScore() : null,
                            result != null ? result.getMatchedSkills() : null,
                            result != null ? result.getMissingSkills() : null,
                            result != null ? result.getSummary() : null,
                            result != null ? result.getYearsExperience() : null,
                            cv.getUploadedAt()
                    );
                })
                .sorted(Comparator.comparing(CandidateMatchResponse::score,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }
}

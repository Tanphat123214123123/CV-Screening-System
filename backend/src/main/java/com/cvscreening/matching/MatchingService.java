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
import org.springframework.transaction.annotation.Transactional;

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
     * Danh sach ung vien cua mot tin tuyen dung, diem cao dung dau.
     * CV chua cham xong (PENDING/FAILED) van hien thi voi score = null, xep cuoi (cu nhat truoc).
     * Doc trong MOT transaction read-only de 3 truy van thay cung mot trang thai du lieu.
     */
    @Transactional(readOnly = true)
    public List<CandidateMatchResponse> getCandidatesForJob(Long jobId, User hr) {
        var job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng."));
        if (!job.getCreatedBy().equals(hr.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không phải người tạo tin này.");
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
                    // Co khoa ngoai fk_cvs_candidate nen ung vien luon ton tai
                    User candidate = candidatesById.get(cv.getCandidateId());
                    return new CandidateMatchResponse(
                            cv.getId(),
                            candidate.getFullName(),
                            candidate.getEmail(),
                            cv.getFileName(),
                            cv.getStatus().name(),
                            cv.getReviewStatus().name(),
                            result != null ? result.getScore() : null,
                            result != null ? result.getMatchedSkills() : null,
                            result != null ? result.getMissingSkills() : null,
                            result != null ? result.getSummary() : null,
                            result != null ? result.getYearsExperience() : null,
                            cv.getUploadedAt(),
                            cv.getReviewedAt()
                    );
                })
                .sorted(Comparator.comparing(CandidateMatchResponse::score,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(CandidateMatchResponse::uploadedAt))
                .toList();
    }
}

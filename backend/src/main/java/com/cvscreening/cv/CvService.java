package com.cvscreening.cv;

import com.cvscreening.cv.CvDtos.CvUploadResponse;
import com.cvscreening.cv.CvDtos.MyApplicationResponse;
import com.cvscreening.cv.CvFileInspector.CvFileType;
import com.cvscreening.exception.ApiException;
import com.cvscreening.exception.DbConstraints;
import com.cvscreening.infrastructure.S3Service;
import com.cvscreening.job.Job;
import com.cvscreening.job.JobRepository;
import com.cvscreening.matching.MatchResult;
import com.cvscreening.matching.MatchResultRepository;
import com.cvscreening.outbox.OutboxService;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CvService {

    private static final String ALREADY_APPLIED = "Bạn đã nộp CV cho vị trí này rồi.";

    private final CvRepository cvRepository;
    private final JobRepository jobRepository;
    private final MatchResultRepository matchResultRepository;
    private final S3Service s3Service;
    private final OutboxService outboxService;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    /**
     * Luong upload CV (phan dong bo cua pipeline):
     * 1. Validate tin tuyen dung + file (noi dung that, khong chi duoi file)   — khong giu transaction
     * 2. Upload file len S3                                                   — khong giu transaction
     * 3. MOT transaction ngan: luu CV (PENDING) + ghi outbox message cho AI worker
     * 4. OutboxRelay gui message sang SQS SAU khi transaction da commit
     *
     * Khong dat @Transactional ca ham: truoc day transaction mo tu buoc 1 nen giu 1 connection DB suot
     * luc upload 5MB len S3 va goi SQS — vai chuc upload cham cung luc la can pool (Hikari mac dinh 10).
     */
    public CvUploadResponse upload(MultipartFile file, Long jobId, User candidate) {
        jobRepository.findById(jobId)
                .filter(job -> Boolean.TRUE.equals(job.getActive()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tin tuyển dụng không tồn tại hoặc đã đóng."));
        // Da nop roi: chi cho nop lai khi AI khong doc duoc file cu (FAILED) - neu khong ung vien
        // bi ket vinh vien voi mot ho so hong ma khong co cach nao sua.
        Cv previous = cvRepository.findByCandidateIdAndJobId(candidate.getId(), jobId).orElse(null);
        if (previous != null && previous.getStatus() != CvStatus.FAILED) {
            throw new ApiException(HttpStatus.CONFLICT, ALREADY_APPLIED);
        }
        // Lay key file cu NGAY BAY GIO: resubmit() se ghi de s3Key cua ho so
        String previousS3Key = previous == null ? null : previous.getS3Key();

        CvFileType type = CvFileInspector.inspect(file);
        String fileName = CvFileNames.displayName(file.getOriginalFilename(), type.extension());
        String s3Key = "cvs/" + UUID.randomUUID() + "-" + CvFileNames.keyPart(fileName, type.extension());

        s3Service.upload(s3Key, file, type.contentType());
        Cv cv;
        try {
            cv = transactionTemplate.execute(status -> {
                Cv saved = previous == null
                        ? cvRepository.save(Cv.builder()
                                .fileName(fileName)
                                .s3Key(s3Key)
                                .candidateId(candidate.getId())
                                .jobId(jobId)
                                .build())
                        : resubmit(previous.getId(), fileName, s3Key);
                outboxService.enqueueCvProcessing(saved);
                return saved;
            });
        } catch (RuntimeException e) {
            // Transaction rollback khong xoa duoc file da len S3 -> don thu cong o MOI duong loi
            s3Service.deleteQuietly(s3Key);
            // Chi dung constraint nay moi la "nop trung" (2 request cung luc deu qua buoc existsBy... o tren)
            if (e instanceof DataIntegrityViolationException
                    && DbConstraints.isViolationOf(e, DbConstraints.UK_CVS_CANDIDATE_JOB)) {
                throw new ApiException(HttpStatus.CONFLICT, ALREADY_APPLIED);
            }
            throw e;
        }

        if (previousS3Key != null) {
            // File hong cu khong con ho so nao tro toi
            s3Service.deleteQuietly(previousS3Key);
        }
        return new CvUploadResponse(cv.getId(), fileName, cv.getStatus().name(), previous == null
                ? "CV đã được tiếp nhận và đang được AI phân tích."
                : "Đã nhận CV mới, AI đang phân tích lại.");
    }

    /** Chay trong transaction cua upload. Khoa dong roi kiem tra lai: request nop lai khac co the vua chay xong. */
    private Cv resubmit(Long cvId, String fileName, String s3Key) {
        Cv cv = cvRepository.findByIdForUpdate(cvId)
                .filter(c -> c.getStatus() == CvStatus.FAILED)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, ALREADY_APPLIED));
        matchResultRepository.deleteByCvId(cvId);
        cv.resubmit(fileName, s3Key, clock.instant());
        return cv;
    }

    @Transactional(readOnly = true)
    public List<MyApplicationResponse> getMyApplications(User candidate) {
        List<Cv> cvs = cvRepository.findByCandidateIdOrderByUploadedAtDesc(candidate.getId());

        Map<Long, String> jobTitleById = jobRepository
                .findAllById(cvs.stream().map(Cv::getJobId).distinct().toList()).stream()
                .collect(Collectors.toMap(Job::getId, Job::getTitle));

        Map<Long, MatchResult> resultByCvId = matchResultRepository
                .findByCvIdIn(cvs.stream().map(Cv::getId).toList()).stream()
                .collect(Collectors.toMap(MatchResult::getCvId, Function.identity()));

        return cvs.stream()
                .map(cv -> {
                    MatchResult result = resultByCvId.get(cv.getId());
                    return new MyApplicationResponse(cv.getId(), cv.getJobId(),
                            jobTitleById.getOrDefault(cv.getJobId(), "(tin đã xoá)"),
                            cv.getFileName(), cv.getStatus().name(), cv.getReviewStatus().name(),
                            result != null ? FitLevel.of(result.getScore()).name() : null,
                            result != null ? result.getMatchedSkills() : null,
                            result != null ? result.getMissingSkills() : null,
                            cv.getUploadedAt());
                })
                .toList();
    }

    /**
     * HR tao tin danh dau ho so: NEW / SHORTLISTED / REJECTED, kem audit (ai, khi nao).
     * SHORTLISTED chi khi AI da cham xong — shortlist mot ho so chua co diem la quyet dinh mu.
     * REJECTED van cho phep voi CV FAILED (file hong, khong doc duoc).
     */
    @Transactional
    public void updateReviewStatus(Long cvId, ReviewStatus status, User hr) {
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy CV."));
        if (!isJobOwner(cv, hr)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền xử lý hồ sơ này.");
        }
        if (status == ReviewStatus.SHORTLISTED && cv.getStatus() != CvStatus.PROCESSED) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ shortlist được hồ sơ đã được AI chấm điểm xong.");
        }
        cv.review(status, hr.getId(), clock.instant());
    }

    /** Chinh chu CV, hoac HR la nguoi tao ra tin tuyen dung ma CV nay nop vao, moi duoc tai file. */
    @Transactional(readOnly = true)
    public String getDownloadUrl(Long cvId, User requester) {
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy CV."));
        boolean isOwner = cv.getCandidateId().equals(requester.getId());
        if (!isOwner && !isJobOwner(cv, requester)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền tải CV này.");
        }
        return s3Service.presignDownloadUrl(cv.getS3Key());
    }

    private boolean isJobOwner(Cv cv, User user) {
        return user.getRole() == Role.HR
                && jobRepository.findById(cv.getJobId())
                        .map(job -> job.getCreatedBy().equals(user.getId()))
                        .orElse(false);
    }
}

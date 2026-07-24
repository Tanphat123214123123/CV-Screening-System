package com.cvscreening.cv;

import com.cvscreening.cv.CvDtos.CvUploadResponse;
import com.cvscreening.cv.CvDtos.MyApplicationResponse;
import com.cvscreening.exception.ApiException;
import com.cvscreening.infrastructure.S3Service;
import com.cvscreening.infrastructure.SqsService;
import com.cvscreening.job.JobRepository;
import com.cvscreening.matching.MatchResultRepository;
import com.cvscreening.job.Job;
import com.cvscreening.matching.MatchResult;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CvService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "docx", "doc");

    private final CvRepository cvRepository;
    private final JobRepository jobRepository;
    private final MatchResultRepository matchResultRepository;
    private final S3Service s3Service;
    private final SqsService sqsService;

    /**
     * Luong upload CV (phan dong bo cua pipeline):
     * 1. Validate file va tin tuyen dung
     * 2. Upload file goc len S3
     * 3. Luu ban ghi CV voi trang thai PENDING
     * 4. Gui message vao SQS -> AI Worker xu ly bat dong bo
     */
    @Transactional
    public CvUploadResponse upload(MultipartFile file, Long jobId, User candidate) {
        jobRepository.findById(jobId)
                .filter(j -> Boolean.TRUE.equals(j.getActive()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tin tuyen dung khong ton tai hoac da dong"));

        cvRepository.findByCandidateIdAndJobId(candidate.getId(), jobId).ifPresent(existing -> {
            throw new ApiException(HttpStatus.CONFLICT, "Ban da nop CV cho vi tri nay roi");
        });

        String originalName = file.getOriginalFilename() == null ? "cv" : file.getOriginalFilename();
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chi chap nhan file PDF hoac Word (.pdf, .docx, .doc)");
        }

        String s3Key = "cvs/" + UUID.randomUUID() + "-" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        s3Service.upload(s3Key, file);

        Cv cv;
        try {
            cv = cvRepository.save(Cv.builder()
                    .fileName(originalName)
                    .s3Key(s3Key)
                    .candidateId(candidate.getId())
                    .jobId(jobId)
                    .build());
        } catch (DataIntegrityViolationException e) {
            // Race condition: 2 request nop CV cung luc cho cung 1 vi tri
            // deu vuot qua kiem tra ifPresent o tren, unique constraint DB chan lai.
            throw new ApiException(HttpStatus.CONFLICT, "Ban da nop CV cho vi tri nay roi");
        }

        sqsService.sendCvProcessingMessage(cv.getId(), jobId, s3Key, originalName);

        return new CvUploadResponse(cv.getId(), originalName, cv.getStatus().name(),
                "CV da duoc tiep nhan va dang duoc AI phan tich");
    }

    public List<MyApplicationResponse> getMyApplications(User candidate) {
        List<Cv> cvs = cvRepository.findByCandidateIdOrderByUploadedAtDesc(candidate.getId());

        Map<Long, String> jobTitleById = jobRepository
                .findAllById(cvs.stream().map(Cv::getJobId).distinct().toList()).stream()
                .collect(Collectors.toMap(Job::getId, Job::getTitle));

        Map<Long, Double> scoreByCvId = matchResultRepository
                .findByCvIdIn(cvs.stream().map(Cv::getId).toList()).stream()
                .collect(Collectors.toMap(MatchResult::getCvId, MatchResult::getScore));

        return cvs.stream()
                .map(cv -> new MyApplicationResponse(cv.getId(), cv.getJobId(),
                        jobTitleById.getOrDefault(cv.getJobId(), "(tin da xoa)"),
                        cv.getFileName(), cv.getStatus().name(),
                        scoreByCvId.get(cv.getId()), cv.getUploadedAt()))
                .toList();
    }

    /** HR hoac chinh chu CV moi duoc tai file. */
    public String getDownloadUrl(Long cvId, User requester) {
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Khong tim thay CV"));
        boolean isOwner = cv.getCandidateId().equals(requester.getId());
        boolean isHr = requester.getRole() == Role.HR;
        if (!isOwner && !isHr) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Ban khong co quyen tai CV nay");
        }
        return s3Service.presignDownloadUrl(cv.getS3Key());
    }

    private String getExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot + 1).toLowerCase();
    }
}

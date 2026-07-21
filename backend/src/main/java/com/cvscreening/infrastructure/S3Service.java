package com.cvscreening.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;

/** Luu tru file CV tren Amazon S3 (hoac MinIO khi chay local). */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    /**
     * Content-type duoc suy ra tu duoi file da validate, KHONG dung
     * file.getContentType() (client tu khai bao, co the gia mao vd:
     * upload file .pdf nhung khai "text/html" -> trinh duyet render
     * nhu HTML khi HR mo presigned URL thay vi tai file ve).
     */
    private static final Map<String, String> SAFE_CONTENT_TYPES = Map.of(
            "pdf", "application/pdf",
            "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "doc", "application/msword"
    );

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.aws.bucket}")
    private String bucket;

    /** Tao bucket neu chua ton tai (tien cho moi truong dev). */
    @PostConstruct
    void ensureBucket() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException e) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            log.info("Da tao bucket: {}", bucket);
        } catch (Exception e) {
            log.warn("Khong kiem tra duoc bucket {}: {}", bucket, e.getMessage());
        }
    }

    public void upload(String key, MultipartFile file) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(resolveSafeContentType(key))
                    .build();
            s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));
        } catch (IOException e) {
            throw new RuntimeException("Loi doc file upload", e);
        }
    }

    private String resolveSafeContentType(String key) {
        int dot = key.lastIndexOf('.');
        String extension = dot < 0 ? "" : key.substring(dot + 1).toLowerCase();
        return SAFE_CONTENT_TYPES.getOrDefault(extension, "application/octet-stream");
    }

    /** Tao URL tai file co thoi han 15 phut (presigned URL). */
    public String presignDownloadUrl(String key) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket).key(key).build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .getObjectRequest(getRequest)
                .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }
}

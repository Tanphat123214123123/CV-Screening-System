package com.cvscreening.infrastructure;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketConfiguration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.Duration;

/** Luu tru file CV tren Amazon S3 (hoac MinIO khi chay local). */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private static final Duration PRESIGN_TTL = Duration.ofMinutes(15);

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.aws.bucket}")
    private String bucket;

    @Value("${app.aws.region}")
    private String region;

    @Value("${app.aws.auto-create-resources:false}")
    private boolean autoCreate;

    /**
     * Dev: tu tao bucket neu chua co. Khong tao duoc (MinIO chua san sang...) -> NEM LOI de backend
     * dung khoi dong (docker `restart: on-failure` se thu lai), thay vi chi log warn roi chay tiep
     * voi bucket khong ton tai — upload dau tien moi vo va rat kho doan nguyen nhan.
     * Production (auto-create = false): bucket tao bang IaC, IAM khong can quyen s3:CreateBucket.
     */
    @PostConstruct
    void ensureBucket() {
        if (!autoCreate) {
            return;
        }
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException e) {
            var createRequest = CreateBucketRequest.builder().bucket(bucket);
            // S3 that: moi region tru us-east-1 BAT BUOC co LocationConstraint
            if (!Region.US_EAST_1.id().equals(region)) {
                createRequest.createBucketConfiguration(CreateBucketConfiguration.builder()
                        .locationConstraint(region)
                        .build());
            }
            s3Client.createBucket(createRequest.build());
            log.info("Đã tạo bucket {} (region {})", bucket, region);
        }
    }

    /**
     * Upload dang stream (khong doc ca file vao RAM nhu getBytes()).
     *
     * @param contentType suy ra tu loai file DA KIEM TRA noi dung (CvFileInspector), khong dung
     *                    file.getContentType() do client tu khai bao va gia mao duoc
     */
    public void upload(String key, MultipartFile file, String contentType) {
        try (InputStream in = file.getInputStream()) {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(request, RequestBody.fromInputStream(in, file.getSize()));
        } catch (IOException e) {
            throw new UncheckedIOException("Lỗi đọc file upload", e);
        }
    }

    /**
     * Xoa file, dung de don dep khi cac buoc sau upload that bai. Khong nem loi: loi don dep khong
     * duoc che mat loi goc cua request (chi log de theo doi file mo coi).
     */
    public void deleteQuietly(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (RuntimeException e) {
            log.error("Không xoá được file mồ côi trên S3: {}", key, e);
        }
    }

    /** URL tai file co thoi han 15 phut (presigned URL). */
    public String presignDownloadUrl(String key) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket).key(key).build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(PRESIGN_TTL)
                .getObjectRequest(getRequest)
                .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }
}

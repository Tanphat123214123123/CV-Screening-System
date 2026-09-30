package com.cvscreening.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.net.URI;

/**
 * Khoi tao AWS SDK client cho S3 va SQS.
 * - Chay local: endpoint tro ve MinIO (S3) va ElasticMQ (SQS), API tuong thich.
 * - Deploy AWS that: de trong endpoint + access key -> SDK ket noi dich vu that va lay quyen tu
 *   IAM role (ECS task role / EC2 instance profile) qua DefaultCredentialsProvider.
 */
@Configuration
@Slf4j
public class AwsConfig {

    @Value("${app.aws.region}") private String region;
    @Value("${app.aws.access-key:}") private String accessKey;
    @Value("${app.aws.secret-key:}") private String secretKey;
    @Value("${app.aws.s3-endpoint:}") private String s3Endpoint;
    @Value("${app.aws.s3-public-endpoint:}") private String s3PublicEndpoint;
    @Value("${app.aws.sqs-endpoint:}") private String sqsEndpoint;

    /**
     * Co khai bao key -> dung key tinh (MinIO/ElasticMQ, hoac IAM user).
     * Khong khai bao -> chuoi mac dinh cua SDK: bien moi truong, ~/.aws, IAM role cua ECS/EC2.
     * Truoc day luon ep StaticCredentialsProvider nen chay tren ECS voi task role se dung nham "minioadmin".
     */
    @Bean
    public AwsCredentialsProvider awsCredentialsProvider() {
        if (accessKey.isBlank() || secretKey.isBlank()) {
            log.info("AWS credentials: DefaultCredentialsProvider (IAM role / environment)");
            return DefaultCredentialsProvider.create();
        }
        return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
    }

    @Bean
    public S3Client s3Client(AwsCredentialsProvider credentials) {
        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials);
        if (!s3Endpoint.isBlank()) {
            builder.endpointOverride(URI.create(s3Endpoint))
                    // MinIO bat buoc path-style; S3 that dung virtual-hosted style mac dinh
                    .serviceConfiguration(pathStyle());
        }
        return builder.build();
    }

    /**
     * Presigned URL duoc TRINH DUYET cua HR mo truc tiep, nen phai ky voi host ma trinh duyet truy cap duoc.
     * Backend chay trong Docker: s3-endpoint = http://minio:9000 (ten noi bo, trinh duyet khong phan giai
     * duoc) -> dung s3-public-endpoint = http://localhost:9000. Host la mot phan cua chu ky SigV4 nen
     * khong the ky voi host noi bo roi thay host sau.
     */
    @Bean
    public S3Presigner s3Presigner(AwsCredentialsProvider credentials) {
        String endpoint = s3PublicEndpoint.isBlank() ? s3Endpoint : s3PublicEndpoint;
        var builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials);
        if (!endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint)).serviceConfiguration(pathStyle());
        }
        return builder.build();
    }

    @Bean
    public SqsClient sqsClient(AwsCredentialsProvider credentials) {
        var builder = SqsClient.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials);
        if (!sqsEndpoint.isBlank()) {
            builder.endpointOverride(URI.create(sqsEndpoint));
        }
        return builder.build();
    }

    private static S3Configuration pathStyle() {
        return S3Configuration.builder().pathStyleAccessEnabled(true).build();
    }
}

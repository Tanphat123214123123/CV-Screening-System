package com.cvscreening.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.net.URI;

/**
 * Khoi tao AWS SDK client cho S3 va SQS.
 * - Chay local: endpoint tro ve MinIO (S3) va ElasticMQ (SQS), API tuong thich 100%.
 * - Deploy AWS that: de trong S3_ENDPOINT / SQS_ENDPOINT, SDK tu ket noi dich vu that.
 */
@Configuration
public class AwsConfig {

    @Value("${app.aws.region}") private String region;
    @Value("${app.aws.access-key}") private String accessKey;
    @Value("${app.aws.secret-key}") private String secretKey;
    @Value("${app.aws.s3-endpoint:}") private String s3Endpoint;
    @Value("${app.aws.sqs-endpoint:}") private String sqsEndpoint;

    private StaticCredentialsProvider credentials() {
        return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
    }

    @Bean
    public S3Client s3Client() {
        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials())
                // path-style bat buoc khi dung MinIO
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        if (!s3Endpoint.isBlank()) {
            builder.endpointOverride(URI.create(s3Endpoint));
        }
        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        var builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials())
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        if (!s3Endpoint.isBlank()) {
            builder.endpointOverride(URI.create(s3Endpoint));
        }
        return builder.build();
    }

    @Bean
    public SqsClient sqsClient() {
        var builder = SqsClient.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials());
        if (!sqsEndpoint.isBlank()) {
            builder.endpointOverride(URI.create(sqsEndpoint));
        }
        return builder.build();
    }
}

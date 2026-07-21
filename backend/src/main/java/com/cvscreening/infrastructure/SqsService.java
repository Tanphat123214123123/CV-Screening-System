package com.cvscreening.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.CreateQueueRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import java.util.Map;

/**
 * Gui message vao Amazon SQS (hoac ElasticMQ khi chay local)
 * de AI Worker xu ly CV bat dong bo.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SqsService {

    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;

    @Value("${app.aws.queue-name}")
    private String queueName;

    private String queueUrl;

    private String getQueueUrl() {
        if (queueUrl == null) {
            // createQueue la idempotent: neu queue da ton tai thi tra ve URL hien co
            queueUrl = sqsClient.createQueue(
                    CreateQueueRequest.builder().queueName(queueName).build()).queueUrl();
        }
        return queueUrl;
    }

    /** Message JSON: { "cvId": ..., "jobId": ..., "s3Key": ..., "fileName": ... } */
    public void sendCvProcessingMessage(Long cvId, Long jobId, String s3Key, String fileName) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "cvId", cvId,
                    "jobId", jobId,
                    "s3Key", s3Key,
                    "fileName", fileName
            ));
            sqsClient.sendMessage(SendMessageRequest.builder()
                    .queueUrl(getQueueUrl())
                    .messageBody(body)
                    .build());
            log.info("Da gui message xu ly CV #{} vao queue", cvId);
        } catch (Exception e) {
            throw new RuntimeException("Loi gui message vao SQS", e);
        }
    }
}

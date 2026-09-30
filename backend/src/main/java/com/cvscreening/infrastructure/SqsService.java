package com.cvscreening.infrastructure;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.CreateQueueRequest;
import software.amazon.awssdk.services.sqs.model.GetQueueUrlRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

/**
 * Gui message vao Amazon SQS (hoac ElasticMQ khi chay local).
 * Chi duoc goi tu OutboxRelay — nghiep vu KHONG gui truc tiep (xem outbox.OutboxService).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SqsService {

    private final SqsClient sqsClient;

    @Value("${app.aws.queue-name}")
    private String queueName;

    @Value("${app.aws.auto-create-resources:false}")
    private boolean autoCreate;

    /** Gan mot lan luc khoi dong, sau do chi doc -> an toan khi nhieu thread cung gui. */
    private volatile String queueUrl;

    /**
     * Xac dinh queue URL ngay khi khoi dong (truoc day khoi tao lazy, khong thread-safe).
     * Dev: createQueue (idempotent). Production: getQueueUrl — queue tao bang IaC, IAM khong can
     * quyen sqs:CreateQueue. Queue khong ton tai -> khong khoi dong duoc, bao loi ngay.
     */
    @PostConstruct
    void resolveQueueUrl() {
        queueUrl = autoCreate
                ? sqsClient.createQueue(CreateQueueRequest.builder().queueName(queueName).build()).queueUrl()
                : sqsClient.getQueueUrl(GetQueueUrlRequest.builder().queueName(queueName).build()).queueUrl();
        log.info("SQS queue: {}", queueUrl);
    }

    public void send(String messageBody) {
        sqsClient.sendMessage(SendMessageRequest.builder()
                .queueUrl(queueUrl)
                .messageBody(messageBody)
                .build());
    }
}

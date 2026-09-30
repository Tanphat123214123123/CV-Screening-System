package com.cvscreening.outbox;

import com.cvscreening.infrastructure.SqsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Day message tu bang outbox_messages sang SQS theo chu ky.
 *
 * Moi lan chay: khoa mot lo message chua gui (SKIP LOCKED), gui tung cai, danh dau da gui.
 * SQS loi -> ghi nhan attempts/lastError va DUNG lo nay (SQS dang hong thi gui tiep cung vo ich);
 * message con nguyen trong DB, lan chay sau thu lai. Worker ghi ket qua bang upsert nen nhan trung
 * message (at-least-once) khong sinh du lieu sai.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxRelay {

    private final OutboxRepository outboxRepository;
    private final SqsService sqsService;
    private final Clock clock;

    @Value("${app.outbox.batch-size:50}")
    private int batchSize;

    @Value("${app.outbox.retention:7d}")
    private Duration retention;

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:1000}")
    @Transactional
    public void relay() {
        List<OutboxMessage> batch = outboxRepository.lockUnsentBatch(batchSize);
        for (OutboxMessage message : batch) {
            try {
                sqsService.send(message.getPayload());
                message.markSent(clock.instant());
            } catch (RuntimeException e) {
                message.markFailed(e.getClass().getSimpleName() + ": " + e.getMessage());
                log.warn("Gửi outbox #{} (CV #{}) sang SQS thất bại, lần thử {}: {}",
                        message.getId(), message.getAggregateId(), message.getAttempts(), e.getMessage());
                break;
            }
        }
    }

    /** Don message da gui lau roi de bang khong phinh vo han. */
    @Scheduled(cron = "0 17 * * * *")
    @Transactional
    public void purgeSent() {
        Instant before = clock.instant().minus(retention);
        int deleted = outboxRepository.deleteSentBefore(before);
        if (deleted > 0) {
            log.info("Đã xoá {} outbox message cũ hơn {}", deleted, retention);
        }
    }
}

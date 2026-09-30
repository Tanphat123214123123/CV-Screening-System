package com.cvscreening.outbox;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** Mot message cho AI worker, cho duoc day sang SQS. */
@Entity
@Table(name = "outbox_messages")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class OutboxMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID cua CV ma message nay yeu cau xu ly (de tra cuu / debug). */
    @Column(nullable = false)
    private Long aggregateId;

    /** Body JSON gui nguyen van sang SQS. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /** null = chua gui. */
    private Instant sentAt;

    @Builder.Default
    @Column(nullable = false)
    private int attempts = 0;

    @Column(columnDefinition = "TEXT")
    private String lastError;

    void markSent(Instant now) {
        this.sentAt = now;
        this.attempts++;
        this.lastError = null;
    }

    void markFailed(String error) {
        this.attempts++;
        this.lastError = error;
    }
}

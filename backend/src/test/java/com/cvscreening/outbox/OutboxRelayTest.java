package com.cvscreening.outbox;

import com.cvscreening.infrastructure.SqsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.exception.SdkClientException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxRelayTest {

    private static final Instant NOW = Instant.parse("2026-09-30T08:00:00Z");

    @Mock private OutboxRepository outboxRepository;
    @Mock private SqsService sqsService;

    private OutboxRelay relay;

    @BeforeEach
    void setUp() {
        relay = new OutboxRelay(outboxRepository, sqsService, Clock.fixed(NOW, ZoneOffset.UTC));
        ReflectionTestUtils.setField(relay, "batchSize", 50);
        ReflectionTestUtils.setField(relay, "retention", Duration.ofDays(7));
    }

    @Test
    void guiThanhCong_danhDauDaGui() {
        var first = message(1, "{\"cvId\":1}");
        var second = message(2, "{\"cvId\":2}");
        when(outboxRepository.lockUnsentBatch(50)).thenReturn(List.of(first, second));

        relay.relay();

        verify(sqsService).send("{\"cvId\":1}");
        verify(sqsService).send("{\"cvId\":2}");
        assertEquals(NOW, first.getSentAt());
        assertEquals(NOW, second.getSentAt());
        assertEquals(1, first.getAttempts());
    }

    @Test
    void sqsLoi_ghiNhanLoi_giuMessageDeThuLai_vaDungLo() {
        var first = message(1, "a");
        var second = message(2, "b");
        when(outboxRepository.lockUnsentBatch(50)).thenReturn(List.of(first, second));
        doThrow(SdkClientException.create("connection refused")).when(sqsService).send("a");

        relay.relay();

        assertNull(first.getSentAt());
        assertEquals(1, first.getAttempts());
        assertTrue(first.getLastError().contains("connection refused"));
        // SQS dang hong: khong gui tiep message sau trong cung lo
        verify(sqsService, never()).send("b");
        assertNull(second.getSentAt());
    }

    @Test
    void thuLaiThanhCong_xoaLoiCu() {
        var message = message(1, "a");
        message.markFailed("loi cu");
        when(outboxRepository.lockUnsentBatch(50)).thenReturn(List.of(message));

        relay.relay();

        assertNotNull(message.getSentAt());
        assertNull(message.getLastError());
        assertEquals(2, message.getAttempts());
    }

    @Test
    void purgeSent_xoaMessageCuHonThoiGianLuuTru() {
        relay.purgeSent();

        verify(outboxRepository).deleteSentBefore(NOW.minus(Duration.ofDays(7)));
        verify(sqsService, never()).send(any());
    }

    private static OutboxMessage message(long id, String payload) {
        return OutboxMessage.builder().id(id).aggregateId(id).payload(payload).build();
    }
}

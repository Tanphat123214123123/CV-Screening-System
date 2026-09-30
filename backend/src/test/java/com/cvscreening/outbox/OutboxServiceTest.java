package com.cvscreening.outbox;

import com.cvscreening.cv.Cv;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OutboxServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock private OutboxRepository outboxRepository;

    /** Hop dong voi AI worker (ai-worker/app/models/schemas.py: cvId, jobId, s3Key, fileName). */
    @Test
    void enqueue_payloadDungHopDongVoiWorker() throws Exception {
        var service = new OutboxService(outboxRepository, objectMapper);
        Cv cv = Cv.builder().id(7L).jobId(3L).s3Key("cvs/abc-cv.pdf").fileName("CV Nguyễn.pdf").build();

        service.enqueueCvProcessing(cv);

        var captor = ArgumentCaptor.forClass(OutboxMessage.class);
        verify(outboxRepository).save(captor.capture());
        OutboxMessage message = captor.getValue();
        assertEquals(7L, message.getAggregateId());
        assertNull(message.getSentAt());
        JsonNode body = objectMapper.readTree(message.getPayload());
        assertEquals(7, body.get("cvId").asInt());
        assertEquals(3, body.get("jobId").asInt());
        assertEquals("cvs/abc-cv.pdf", body.get("s3Key").asText());
        assertEquals("CV Nguyễn.pdf", body.get("fileName").asText());
    }
}

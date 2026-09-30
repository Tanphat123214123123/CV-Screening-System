package com.cvscreening.outbox;

import com.cvscreening.cv.Cv;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Transactional Outbox — thay cho viec gui SQS truc tiep trong transaction nghiep vu.
 *
 * Van de cu: gui SQS truoc khi transaction commit.
 *  - Worker nhan message qua nhanh -> UPDATE cvs ... khong thay dong chua commit -> CV ket PENDING mai mai.
 *  - Gui xong ma commit that bai -> worker xu ly mot CV khong ton tai.
 * Cach moi: ghi message vao bang outbox_messages TRONG CUNG transaction voi CV (cung commit / cung
 * rollback). OutboxRelay chi doc duoc dong da commit roi moi gui SQS -> ca hai loi tren bien mat,
 * SQS tam loi thi message van nam trong DB va duoc gui lai (at-least-once).
 */
@Service
@RequiredArgsConstructor
public class OutboxService {

    private final OutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    /** MANDATORY: goi ngoai transaction la loi lap trinh — outbox mat y nghia neu khong chung transaction. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueueCvProcessing(Cv cv) {
        // Hop dong message voi AI worker (ai-worker/app/models/schemas.py)
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cvId", cv.getId());
        body.put("jobId", cv.getJobId());
        body.put("s3Key", cv.getS3Key());
        body.put("fileName", cv.getFileName());
        outboxRepository.save(OutboxMessage.builder()
                .aggregateId(cv.getId())
                .payload(toJson(body))
                .build());
    }

    private String toJson(Map<String, Object> body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Không tạo được message JSON", e);
        }
    }
}

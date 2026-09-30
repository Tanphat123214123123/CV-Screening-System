package com.cvscreening.outbox;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxMessage, Long> {

    /**
     * Khoa mot lo message chua gui. FOR UPDATE SKIP LOCKED: chay nhieu instance backend cung luc
     * thi moi instance lay mot lo KHAC nhau, khong gui trung va khong phai cho nhau.
     */
    @Query(value = """
            SELECT * FROM outbox_messages
            WHERE sent_at IS NULL
            ORDER BY id
            LIMIT :limit
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<OutboxMessage> lockUnsentBatch(@Param("limit") int limit);

    @Modifying
    @Query("delete from OutboxMessage m where m.sentAt is not null and m.sentAt < :before")
    int deleteSentBefore(@Param("before") Instant before);

    long countBySentAtIsNull();
}

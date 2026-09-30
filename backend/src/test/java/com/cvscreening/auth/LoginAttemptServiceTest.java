package com.cvscreening.auth;

import com.cvscreening.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class LoginAttemptServiceTest {

    private static final String EMAIL = "a@test.com";
    private static final String IP = "10.0.0.1";

    private MutableClock clock;
    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-09-30T08:00:00Z"));
        service = new LoginAttemptService(5, 20, Duration.ofMinutes(15), Duration.ofMinutes(15), clock);
    }

    @Test
    void sai5LanTheoEmail_biKhoa_kemRetryAfter() {
        failTimes(EMAIL, IP, 4);
        assertDoesNotThrow(() -> service.ensureNotLocked(EMAIL, IP));

        service.recordFailure(EMAIL, IP);

        var ex = assertThrows(ApiException.class, () -> service.ensureNotLocked(EMAIL, IP));
        assertEquals(429, ex.getStatus().value());
        assertEquals(Duration.ofMinutes(15), ex.getRetryAfter());
    }

    @Test
    void hetThoiGianKhoa_dangNhapLaiDuoc() {
        failTimes(EMAIL, IP, 5);

        clock.advance(Duration.ofMinutes(15));

        assertDoesNotThrow(() -> service.ensureNotLocked(EMAIL, IP));
    }

    @Test
    void dangNhapDung_xoaBoDem() {
        failTimes(EMAIL, IP, 4);
        service.recordSuccess(EMAIL);
        failTimes(EMAIL, IP, 4);

        assertDoesNotThrow(() -> service.ensureNotLocked(EMAIL, IP));
    }

    @Test
    void saiRaiRacNgoaiCuaSo_khongCongDon() {
        failTimes(EMAIL, IP, 4);
        clock.advance(Duration.ofMinutes(16));
        failTimes(EMAIL, IP, 4);

        assertDoesNotThrow(() -> service.ensureNotLocked(EMAIL, IP));
    }

    @Test
    void motIpThuNhieuEmail_biKhoaTheoIp() {
        for (int i = 0; i < 20; i++) {
            service.recordFailure("user" + i + "@test.com", IP);
        }

        assertThrows(ApiException.class, () -> service.ensureNotLocked("moi@test.com", IP));
        assertDoesNotThrow(() -> service.ensureNotLocked("moi@test.com", "10.0.0.2"));
    }

    @Test
    void khoaTheoEmail_khongAnhHuongEmailKhac() {
        failTimes(EMAIL, IP, 5);

        assertDoesNotThrow(() -> service.ensureNotLocked("khac@test.com", "10.0.0.9"));
    }

    @Test
    void purgeExpired_donMucHetHan() {
        failTimes(EMAIL, IP, 5);
        clock.advance(Duration.ofMinutes(31));

        service.purgeExpired();

        // Sau khi don, 4 lan sai moi chua du de khoa
        failTimes(EMAIL, IP, 4);
        assertDoesNotThrow(() -> service.ensureNotLocked(EMAIL, IP));
    }

    private void failTimes(String email, String ip, int times) {
        for (int i = 0; i < times; i++) {
            service.recordFailure(email, ip);
        }
    }

    /** Clock co the tua thoi gian trong test. */
    static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}

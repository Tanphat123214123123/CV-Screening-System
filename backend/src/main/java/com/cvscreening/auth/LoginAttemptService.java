package com.cvscreening.auth;

import com.cvscreening.exception.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Chong do mat khau (brute-force) cho /api/auth/login.
 *
 * Dem so lan SAI theo 2 khoa doc lap:
 *  - theo email: chan do mat khau mot tai khoan cu the (nguong thap);
 *  - theo IP:    chan mot may thu hang loat email khac nhau (nguong cao hon).
 * Vuot nguong trong cua so {@code window} -> khoa {@code lockDuration}, tra 429 + Retry-After.
 * Dang nhap dung -> xoa bo dem cua email do.
 *
 * Gioi han: luu trong RAM cua mot instance. Chay nhieu instance sau load balancer thi can chuyen
 * sang kho chung (Redis) — interface cua lop nay giu nguyen.
 */
@Service
public class LoginAttemptService {

    private final int maxPerEmail;
    private final int maxPerIp;
    private final Duration window;
    private final Duration lockDuration;
    private final Clock clock;

    private final Map<String, Attempts> byEmail = new ConcurrentHashMap<>();
    private final Map<String, Attempts> byIp = new ConcurrentHashMap<>();

    @Autowired
    public LoginAttemptService(@Value("${app.auth.login.max-attempts-per-email}") int maxPerEmail,
                               @Value("${app.auth.login.max-attempts-per-ip}") int maxPerIp,
                               @Value("${app.auth.login.window}") Duration window,
                               @Value("${app.auth.login.lock-duration}") Duration lockDuration) {
        this(maxPerEmail, maxPerIp, window, lockDuration, Clock.systemUTC());
    }

    LoginAttemptService(int maxPerEmail, int maxPerIp, Duration window, Duration lockDuration, Clock clock) {
        this.maxPerEmail = maxPerEmail;
        this.maxPerIp = maxPerIp;
        this.window = window;
        this.lockDuration = lockDuration;
        this.clock = clock;
    }

    /** Goi TRUOC khi kiem tra mat khau: dang bi khoa thi nem 429, khong ton BCrypt. */
    public void ensureNotLocked(String email, String ip) {
        Instant now = clock.instant();
        Duration remaining = max(remainingLock(byEmail.get(email), now), remainingLock(byIp.get(ip), now));
        if (!remaining.isZero()) {
            long minutes = Math.max(1, (remaining.toSeconds() + 59) / 60);
            throw ApiException.tooManyRequests(
                    "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau " + minutes + " phút.", remaining);
        }
    }

    public void recordFailure(String email, String ip) {
        Instant now = clock.instant();
        byEmail.compute(email, (k, a) -> next(a, now, maxPerEmail));
        byIp.compute(ip, (k, a) -> next(a, now, maxPerIp));
    }

    public void recordSuccess(String email) {
        byEmail.remove(email);
    }

    /** Don cac muc da het han de Map khong phinh vo han. */
    @Scheduled(fixedDelay = 10 * 60 * 1000)
    public void purgeExpired() {
        Instant now = clock.instant();
        byEmail.values().removeIf(a -> a.isExpired(now, window));
        byIp.values().removeIf(a -> a.isExpired(now, window));
    }

    private Attempts next(Attempts current, Instant now, int max) {
        Attempts base = (current == null || current.isExpired(now, window)) ? new Attempts(0, now, null) : current;
        int failures = base.failures() + 1;
        Instant lockedUntil = failures >= max ? now.plus(lockDuration) : base.lockedUntil();
        return new Attempts(failures, base.windowStart(), lockedUntil);
    }

    private static Duration remainingLock(Attempts attempts, Instant now) {
        if (attempts == null || attempts.lockedUntil() == null || !now.isBefore(attempts.lockedUntil())) {
            return Duration.ZERO;
        }
        return Duration.between(now, attempts.lockedUntil());
    }

    private static Duration max(Duration a, Duration b) {
        return a.compareTo(b) >= 0 ? a : b;
    }

    private record Attempts(int failures, Instant windowStart, Instant lockedUntil) {
        /** Het cua so dem VA khong con bi khoa. */
        boolean isExpired(Instant now, Duration window) {
            boolean windowOver = !now.isBefore(windowStart.plus(window));
            boolean lockOver = lockedUntil == null || !now.isBefore(lockedUntil);
            return windowOver && lockOver;
        }
    }
}

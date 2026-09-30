package com.cvscreening.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.time.Duration;

@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    /** Chi dung cho 429: client nen doi bao lau truoc khi thu lai (header Retry-After). */
    private final Duration retryAfter;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    private ApiException(HttpStatus status, String message, Duration retryAfter) {
        super(message);
        this.status = status;
        this.retryAfter = retryAfter;
    }

    public static ApiException tooManyRequests(String message, Duration retryAfter) {
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, message, retryAfter);
    }
}

package com.cvscreening.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatusCode;

import java.time.Instant;
import java.util.Map;

/**
 * Format loi DUY NHAT cua toan bo API — dung chung cho GlobalExceptionHandler (loi trong controller)
 * va RestAuthErrorHandlers (loi 401/403 o tang security filter, truoc khi toi controller).
 *
 * @param fieldErrors chi co khi loi validate: ten truong -> thong bao (tat ca loi, khong chi loi dau)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        String timestamp,
        int status,
        String message,
        Map<String, String> fieldErrors
) {
    public static ApiError of(HttpStatusCode status, String message) {
        return new ApiError(Instant.now().toString(), status.value(), message, null);
    }

    public static ApiError of(HttpStatusCode status, String message, Map<String, String> fieldErrors) {
        return new ApiError(Instant.now().toString(), status.value(), message, fieldErrors);
    }
}

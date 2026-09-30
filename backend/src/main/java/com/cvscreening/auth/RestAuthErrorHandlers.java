package com.cvscreening.auth;

import com.cvscreening.exception.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Loi 401/403 phat sinh o TANG FILTER cua Spring Security — xay ra truoc khi request toi controller
 * nen @RestControllerAdvice khong bat duoc.
 *
 * Truoc day khong cau hinh entry point -> Spring Security mac dinh Http403ForbiddenEntryPoint:
 * thieu token hoac token HET HAN deu tra 403. Frontend chi quay ve trang dang nhap khi nhan 401,
 * nen nguoi dung het phien bi ket o thong bao "khong co quyen".
 */
@Component
@RequiredArgsConstructor
public class RestAuthErrorHandlers {

    private final ObjectMapper objectMapper;

    /** Chua xac thuc (khong co token / token sai / het han) -> 401. */
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, ex) -> write(response, HttpStatus.UNAUTHORIZED,
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
    }

    /** Da xac thuc nhung khong du quyen (o tang filter) -> 403. */
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> write(response, HttpStatus.FORBIDDEN,
                "Bạn không có quyền thực hiện thao tác này.");
    }

    private void write(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getOutputStream(), ApiError.of(status, message));
    }
}

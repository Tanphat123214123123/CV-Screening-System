package com.cvscreening.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Chuyen moi exception thanh {@link ApiError}.
 *
 * Ke thua ResponseEntityExceptionHandler: lop nay da xu ly DUNG ma HTTP cho toan bo exception chuan
 * cua Spring MVC (404 URL sai, 405 sai method, 415 sai Content-Type, 400 thieu tham so/part...).
 * Truoc day handler tu viet bat Exception.class nen cac loi do deu thanh 500 + log ERROR.
 * O day chi override handleExceptionInternal de doi body sang format chung + thong bao tieng Viet.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApiException(ApiException ex) {
        var response = ResponseEntity.status(ex.getStatus());
        if (ex.getRetryAfter() != null) {
            response.header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfter().toSeconds()));
        }
        return response.body(ApiError.of(ex.getStatus(), ex.getMessage()));
    }

    /** Loi rang buoc DB con sot lai (service chua bat rieng): phan loai theo SQLState, khong mac dinh 500. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex) {
        String sqlState = DbConstraints.sqlState(ex).orElse("");
        log.warn("Vi pham rang buoc du lieu (SQLState={}, constraint={}): {}", sqlState,
                DbConstraints.constraintName(ex).orElse("?"), ex.getMostSpecificCause().getMessage());
        return switch (sqlState) {
            case DbConstraints.UNIQUE_VIOLATION -> error(HttpStatus.CONFLICT, "Dữ liệu bị trùng lặp.");
            case DbConstraints.STRING_TOO_LONG -> error(HttpStatus.BAD_REQUEST, "Dữ liệu vượt quá độ dài cho phép.");
            case DbConstraints.CHECK_VIOLATION -> error(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ.");
            case DbConstraints.FOREIGN_KEY_VIOLATION ->
                    error(HttpStatus.CONFLICT, "Dữ liệu tham chiếu không tồn tại hoặc đang được sử dụng.");
            default -> error(HttpStatus.CONFLICT, "Dữ liệu xung đột, vui lòng thử lại.");
        };
    }

    /** @PreAuthorize tu choi (da dang nhap nhung sai vai tro). Chua dang nhap do RestAuthErrorHandlers xu ly. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
        log.error("Lỗi không xác định", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống.");
    }

    /** Validate @Valid @RequestBody: tra ve TAT CA loi (truoc day chi loi dau tien). */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(@NonNull MethodArgumentNotValidException ex,
                                                                  @NonNull HttpHeaders headers,
                                                                  @NonNull HttpStatusCode status,
                                                                  @NonNull WebRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(err -> fieldErrors.putIfAbsent(err.getField(), err.getDefaultMessage()));
        ex.getBindingResult().getGlobalErrors()
                .forEach(err -> fieldErrors.putIfAbsent(err.getObjectName(), err.getDefaultMessage()));
        String message = fieldErrors.isEmpty()
                ? "Dữ liệu không hợp lệ."
                : String.join(" ", fieldErrors.values());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .headers(headers)
                .body(ApiError.of(HttpStatus.BAD_REQUEST, message, fieldErrors));
    }

    /** Diem chung cho moi exception chuan ma ResponseEntityExceptionHandler da xac dinh dung ma HTTP. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(@NonNull Exception ex,
                                                             @Nullable Object body,
                                                             @NonNull HttpHeaders headers,
                                                             @NonNull HttpStatusCode statusCode,
                                                             @NonNull WebRequest request) {
        if (statusCode.is5xxServerError()) {
            log.error("Lỗi hệ thống khi xử lý request", ex);
        } else {
            log.debug("Request không hợp lệ ({}): {}", statusCode.value(), ex.getMessage());
        }
        return ResponseEntity.status(statusCode)
                .headers(headers)   // giu header chuan, vd "Allow" cua 405
                .body(ApiError.of(statusCode, messageFor(ex, statusCode)));
    }

    private static String messageFor(Exception ex, HttpStatusCode status) {
        if (ex instanceof NoResourceFoundException || ex instanceof NoHandlerFoundException) {
            return "Không tìm thấy đường dẫn API.";
        }
        if (ex instanceof HttpRequestMethodNotSupportedException e) {
            return "Phương thức " + e.getMethod() + " không được hỗ trợ cho đường dẫn này.";
        }
        if (ex instanceof HttpMediaTypeNotSupportedException) {
            return "Định dạng dữ liệu (Content-Type) không được hỗ trợ.";
        }
        if (ex instanceof HttpMediaTypeNotAcceptableException) {
            return "Không hỗ trợ định dạng phản hồi được yêu cầu.";
        }
        if (ex instanceof MissingServletRequestParameterException e) {
            return "Thiếu tham số bắt buộc: " + e.getParameterName() + ".";
        }
        if (ex instanceof MissingServletRequestPartException e) {
            return "Thiếu phần bắt buộc trong form upload: " + e.getRequestPartName() + ".";
        }
        if (ex instanceof MethodArgumentTypeMismatchException e) {
            return "Tham số '" + e.getName() + "' không hợp lệ.";
        }
        if (ex instanceof TypeMismatchException) {
            return "Tham số không hợp lệ.";
        }
        if (ex instanceof HttpMessageNotReadableException) {
            return "Dữ liệu gửi lên không đúng định dạng JSON.";
        }
        if (ex instanceof MaxUploadSizeExceededException) {
            return "File vượt quá kích thước cho phép (5MB).";
        }
        if (ex instanceof HandlerMethodValidationException) {
            return "Tham số không hợp lệ.";
        }
        return status.is5xxServerError() ? "Đã xảy ra lỗi hệ thống." : "Yêu cầu không hợp lệ.";
    }

    private static ResponseEntity<ApiError> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ApiError.of(status, message));
    }
}

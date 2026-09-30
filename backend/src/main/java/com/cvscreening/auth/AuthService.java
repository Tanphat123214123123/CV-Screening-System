package com.cvscreening.auth;

import com.cvscreening.auth.dto.AuthResponse;
import com.cvscreening.auth.dto.LoginRequest;
import com.cvscreening.auth.dto.RegisterRequest;
import com.cvscreening.exception.ApiException;
import com.cvscreening.exception.DbConstraints;
import com.cvscreening.user.AppUserDetails;
import com.cvscreening.user.Emails;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import com.cvscreening.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class AuthService {

    /** BCrypt chi dung 72 byte dau cua mat khau; phan con lai bi bo qua (goc cua CVE-2025-22228). */
    static final int MAX_PASSWORD_BYTES = 72;

    private static final String BAD_CREDENTIALS = "Email hoặc mật khẩu không đúng.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttempts;
    private final String hrInviteCode;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil,
                       LoginAttemptService loginAttempts,
                       @Value("${app.auth.hr-invite-code:}") String hrInviteCode) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.loginAttempts = loginAttempts;
        this.hrInviteCode = hrInviteCode == null ? "" : hrInviteCode.trim();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.role() == Role.HR) {
            requireValidHrInvite(request.hrInviteCode());
        }
        if (utf8Length(request.password()) > MAX_PASSWORD_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu quá dài (tối đa 72 byte).");
        }
        String email = Emails.normalize(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email đã được sử dụng.");
        }
        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(request.role())
                .build();
        try {
            // IDENTITY -> INSERT chay ngay tai day, loi unique bat duoc trong try
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            // 2 request dang ky cung email cung luc deu qua existsByEmail; unique constraint chan request sau
            if (DbConstraints.isViolationOf(e, DbConstraints.UK_USERS_EMAIL)) {
                throw new ApiException(HttpStatus.CONFLICT, "Email đã được sử dụng.");
            }
            throw e;
        }
        return buildResponse(user);
    }

    public AuthResponse login(LoginRequest request, String clientIp) {
        String email = Emails.normalize(request.email());
        loginAttempts.ensureNotLocked(email, clientIp);

        // Mat khau > 72 byte khong the thuoc ve tai khoan nao (dang ky da chan) -> sai, khong dua vao BCrypt
        if (utf8Length(request.password()) > MAX_PASSWORD_BYTES) {
            loginAttempts.recordFailure(email, clientIp);
            throw new ApiException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }
        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password()));
            loginAttempts.recordSuccess(email);
            return buildResponse(((AppUserDetails) authentication.getPrincipal()).user());
        } catch (AuthenticationException e) {
            loginAttempts.recordFailure(email, clientIp);
            throw new ApiException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }
    }

    private void requireValidHrInvite(String providedCode) {
        if (hrInviteCode.isEmpty()) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Hệ thống đang tắt đăng ký tài khoản nhà tuyển dụng. Vui lòng liên hệ quản trị viên.");
        }
        byte[] expected = hrInviteCode.getBytes(StandardCharsets.UTF_8);
        byte[] actual = (providedCode == null ? "" : providedCode.trim()).getBytes(StandardCharsets.UTF_8);
        // So sanh thoi gian hang so: khong lo do dai tien to dung qua thoi gian phan hoi
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Mã mời nhà tuyển dụng không đúng.");
        }
    }

    private static int utf8Length(String value) {
        return value == null ? 0 : value.getBytes(StandardCharsets.UTF_8).length;
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getFullName(),
                user.getEmail(), user.getRole().name());
    }
}

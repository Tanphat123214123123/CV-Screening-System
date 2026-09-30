package com.cvscreening.auth;

import com.cvscreening.auth.dto.AuthResponse;
import com.cvscreening.auth.dto.LoginRequest;
import com.cvscreening.auth.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Đăng ký / đăng nhập")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản. Tài khoản HR cần mã mời (hrInviteCode).")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /**
     * IP lay tu getRemoteAddr(). Sau reverse proxy / load balancer: bat
     * server.forward-headers-strategy de Spring doc X-Forwarded-For tu proxy tin cay
     * (KHONG tu doc header nay — client gia mao duoc de ne gioi han theo IP).
     */
    @PostMapping("/login")
    @Operation(summary = "Đăng nhập, trả về JWT. Sai quá nhiều lần sẽ bị khóa tạm thời (429).")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest.getRemoteAddr()));
    }
}

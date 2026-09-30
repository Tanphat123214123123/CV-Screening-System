package com.cvscreening.auth;

import com.cvscreening.auth.dto.LoginRequest;
import com.cvscreening.auth.dto.RegisterRequest;
import com.cvscreening.exception.ApiException;
import com.cvscreening.exception.DbConstraints;
import com.cvscreening.user.AppUserDetails;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import com.cvscreening.user.UserRepository;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.sql.SQLException;
import java.time.Clock;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    private static final String INVITE = "MOI-HR-2026";
    private static final String IP = "10.0.0.1";

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;

    private JwtUtil jwtUtil;
    private LoginAttemptService loginAttempts;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil("test-secret-key-dai-it-nhat-32-byte-cho-hs256!!", 60_000, new MockEnvironment());
        loginAttempts = new LoginAttemptService(5, 20, Duration.ofMinutes(15), Duration.ofMinutes(15),
                Clock.systemUTC());
        authService = service(INVITE);
        when(passwordEncoder.encode(any())).thenReturn("$2a$hash");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(42L);
            return u;
        });
    }

    private AuthService service(String inviteCode) {
        return new AuthService(userRepository, passwordEncoder, authenticationManager, jwtUtil, loginAttempts,
                inviteCode);
    }

    private static RegisterRequest register(String email, String password, Role role, String invite) {
        return new RegisterRequest("  Nguyen Van A ", email, password, role, invite);
    }

    // ---------- dang ky ----------

    @Test
    void register_chuanHoaEmail_vaTrimHoTen() {
        var response = authService.register(register("  Hr@Demo.COM ", "matkhau123", Role.CANDIDATE, null));

        var captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(captor.capture());
        assertEquals("hr@demo.com", captor.getValue().getEmail());
        assertEquals("Nguyen Van A", captor.getValue().getFullName());
        assertEquals("hr@demo.com", response.email());
        verify(userRepository).existsByEmail("hr@demo.com");
    }

    @Test
    void register_hrKhongCoMaMoi_bao403() {
        var ex = assertThrows(ApiException.class,
                () -> authService.register(register("hr@x.com", "matkhau123", Role.HR, null)));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void register_hrSaiMaMoi_bao403() {
        var ex = assertThrows(ApiException.class,
                () -> authService.register(register("hr@x.com", "matkhau123", Role.HR, "doan-bua")));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void register_hrDungMaMoi_thanhCong() {
        var response = authService.register(register("hr@x.com", "matkhau123", Role.HR, " " + INVITE + " "));

        assertEquals("HR", response.role());
    }

    @Test
    void register_heThongTatDangKyHr_bao403_duCoGuiMa() {
        var disabled = service("");

        var ex = assertThrows(ApiException.class,
                () -> disabled.register(register("hr@x.com", "matkhau123", Role.HR, "")));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void register_emailDaTonTai_bao409() {
        when(userRepository.existsByEmail("a@x.com")).thenReturn(true);

        var ex = assertThrows(ApiException.class,
                () -> authService.register(register("A@x.com", "matkhau123", Role.CANDIDATE, null)));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void register_haiRequestCungLuc_uniqueConstraint_bao409ThayVi500() {
        var sql = new SQLException("duplicate", DbConstraints.UNIQUE_VIOLATION);
        when(userRepository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("dup",
                new ConstraintViolationException("dup", sql, DbConstraints.UK_USERS_EMAIL)));

        var ex = assertThrows(ApiException.class,
                () -> authService.register(register("a@x.com", "matkhau123", Role.CANDIDATE, null)));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void register_matKhauVuot72Byte_bao400() {
        // 25 ky tu "ệ" = 75 byte UTF-8: qua duoc @Size(max=72) (dem ky tu) nhung BCrypt se cat bot
        var ex = assertThrows(ApiException.class,
                () -> authService.register(register("a@x.com", "ệ".repeat(25), Role.CANDIDATE, null)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(passwordEncoder, never()).encode(any());
    }

    // ---------- dang nhap ----------

    @Test
    void login_dung_traToken_dungEmailDaChuanHoa() {
        User user = User.builder().id(1L).fullName("A").email("a@x.com").password("h").role(Role.CANDIDATE).build();
        var principal = new AppUserDetails(user);
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        var response = authService.login(new LoginRequest(" A@X.com ", "matkhau123"), IP);

        assertEquals(1L, response.userId());
        assertTrue(jwtUtil.validSubject(response.token()).isPresent());
        var captor = ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(captor.capture());
        assertEquals("a@x.com", captor.getValue().getPrincipal());
        // Khong query lai user sau khi xac thuc: dung principal tra ve
        verifyNoInteractions(userRepository);
    }

    @Test
    void login_sai_bao401() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        var ex = assertThrows(ApiException.class,
                () -> authService.login(new LoginRequest("a@x.com", "sai"), IP));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void login_sai5Lan_lanThu6Bao429_vaKhongKiemTraMatKhauNua() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));
        for (int i = 0; i < 5; i++) {
            assertThrows(ApiException.class, () -> authService.login(new LoginRequest("a@x.com", "sai"), IP));
        }

        var ex = assertThrows(ApiException.class,
                () -> authService.login(new LoginRequest("A@X.COM", "dung-roi"), IP));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertNotNull(ex.getRetryAfter());
        verify(authenticationManager, times(5)).authenticate(any());
    }

    @Test
    void login_matKhauVuot72Byte_bao401_khongGoiBCrypt() {
        var ex = assertThrows(ApiException.class,
                () -> authService.login(new LoginRequest("a@x.com", "ệ".repeat(25)), IP));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        verifyNoInteractions(authenticationManager);
    }
}

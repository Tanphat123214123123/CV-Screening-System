package com.cvscreening.web;

import com.cvscreening.auth.AuthController;
import com.cvscreening.auth.AuthService;
import com.cvscreening.auth.JwtUtil;
import com.cvscreening.auth.RestAuthErrorHandlers;
import com.cvscreening.auth.dto.AuthResponse;
import com.cvscreening.auth.dto.LoginRequest;
import com.cvscreening.config.SecurityConfig;
import com.cvscreening.cv.CvController;
import com.cvscreening.cv.CvService;
import com.cvscreening.exception.ApiException;
import com.cvscreening.job.JobController;
import com.cvscreening.job.JobService;
import com.cvscreening.matching.MatchingController;
import com.cvscreening.matching.MatchingService;
import com.cvscreening.user.AppUserDetails;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import com.cvscreening.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Duration;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Chay Spring MVC + Spring Security that (khong co DB/AWS): kiem ma HTTP va format loi cua toan API.
 *
 * Regression cho cac loi da xac minh truoc khi sua:
 *  - thieu token / token het han tra 403 (frontend khong dua ve trang dang nhap) -> nay 401
 *  - URL sai, sai method, sai Content-Type, upload thieu file deu thanh 500 -> nay 404/405/415/400
 *  - tieu de 300 ky tu lot qua validate roi 500 o DB -> nay 400 kem fieldErrors
 */
@WebMvcTest(controllers = {JobController.class, CvController.class, AuthController.class, MatchingController.class})
@Import({SecurityConfig.class, JwtUtil.class, RestAuthErrorHandlers.class})
class SecurityAndErrorHandlingTest {

    private static final String FRONTEND = "http://localhost:5173";

    @Autowired private MockMvc mvc;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private Environment environment;

    @MockitoBean private UserService userService;
    @MockitoBean private JobService jobService;
    @MockitoBean private CvService cvService;
    @MockitoBean private AuthService authService;
    @MockitoBean private MatchingService matchingService;

    private String hrToken;
    private String candidateToken;

    @BeforeEach
    void setUp() {
        mockUser(2L, "hr@test.com", Role.HR);
        mockUser(1L, "c@test.com", Role.CANDIDATE);
        hrToken = jwtUtil.generateToken("hr@test.com", "HR");
        candidateToken = jwtUtil.generateToken("c@test.com", "CANDIDATE");
    }

    private void mockUser(long id, String email, Role role) {
        User user = User.builder().id(id).email(email).role(role).fullName("T").password("x").build();
        when(userService.loadUserByUsername(email)).thenReturn(new AppUserDetails(user));
    }

    private static MockHttpServletRequestBuilder as(String token, MockHttpServletRequestBuilder request) {
        return request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }

    // ---------- 401: chua xac thuc ----------

    @Test
    void khongGuiToken_401_json() throws Exception {
        mvc.perform(get("/api/jobs/mine"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value(containsString("đăng nhập")));
    }

    @Test
    void tokenHetHan_401() throws Exception {
        String expired = new JwtUtil(environment.getProperty("app.jwt.secret"), -60_000, environment)
                .generateToken("hr@test.com", "HR");

        mvc.perform(as(expired, get("/api/jobs/mine"))).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenBiSua_401() throws Exception {
        mvc.perform(as(hrToken + "x", get("/api/jobs/mine"))).andExpect(status().isUnauthorized());
    }

    @Test
    void userDaBiXoa_401() throws Exception {
        String ghost = jwtUtil.generateToken("ghost@test.com", "HR");
        when(userService.loadUserByUsername("ghost@test.com"))
                .thenThrow(new org.springframework.security.core.userdetails.UsernameNotFoundException("x"));

        mvc.perform(as(ghost, get("/api/jobs/mine"))).andExpect(status().isUnauthorized());
    }

    // ---------- 403: da xac thuc nhung sai vai tro ----------

    @Test
    void ungVienGoiApiCuaHr_403() throws Exception {
        mvc.perform(as(candidateToken, get("/api/jobs/mine")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        verifyNoInteractions(jobService);
    }

    @Test
    void hrGoiApiCuaUngVien_403() throws Exception {
        mvc.perform(as(hrToken, get("/api/cv/mine"))).andExpect(status().isForbidden());
    }

    @Test
    void hrDungTokenHopLe_200() throws Exception {
        when(jobService.getJobsOf(any())).thenReturn(List.of());

        mvc.perform(as(hrToken, get("/api/jobs/mine"))).andExpect(status().isOk());
    }

    // ---------- loi chuan cua Spring MVC khong con thanh 500 ----------

    @Test
    void urlKhongTonTai_404() throws Exception {
        mvc.perform(as(hrToken, get("/api/khong-ton-tai")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Không tìm thấy đường dẫn API."));
    }

    @Test
    void saiMethod_405_kemHeaderAllow() throws Exception {
        mvc.perform(as(hrToken, put("/api/jobs")))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().exists(HttpHeaders.ALLOW));
    }

    @Test
    void saiContentType_415() throws Exception {
        mvc.perform(as(hrToken, post("/api/jobs")).contentType(MediaType.TEXT_PLAIN).content("abc"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void uploadThieuFile_400() throws Exception {
        mvc.perform(as(candidateToken, multipart("/api/cv/upload")).param("jobId", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("file")));
        verifyNoInteractions(cvService);
    }

    @Test
    void thamSoSaiKieu_400() throws Exception {
        mvc.perform(as(hrToken, get("/api/jobs/abc")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("id")));
    }

    @Test
    void jsonHong_400() throws Exception {
        mvc.perform(as(hrToken, post("/api/jobs")).contentType(MediaType.APPLICATION_JSON).content("{title:"))
                .andExpect(status().isBadRequest());
    }

    // ---------- validate ----------

    @Test
    void tieuDe300KyTu_400_kemFieldErrors_khongToiService() throws Exception {
        String body = "{\"title\":\"" + "A".repeat(300) + "\",\"description\":\"d\",\"requiredSkills\":\"Java\"}";

        mvc.perform(as(hrToken, post("/api/jobs")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());
        verifyNoInteractions(jobService);
    }

    @Test
    void dangKySaiNhieuTruong_traVeTatCaLoi() throws Exception {
        String body = "{\"fullName\":\"\",\"email\":\"khong-phai-email\",\"password\":\"123\",\"role\":\"CANDIDATE\"}";

        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.fullName").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    /** Regression (bat duoc boi integration test): @Email tu choi email co khoang trang truoc khi service kip chuan hoa. */
    @Test
    void dangNhapEmailCoKhoangTrangVaChuHoa_duocChuanHoaTruocValidate() throws Exception {
        var captor = ArgumentCaptor.forClass(LoginRequest.class);
        when(authService.login(captor.capture(), anyString()))
                .thenReturn(new AuthResponse("t", 1L, "A", "a@x.com", "CANDIDATE"));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"  A@X.com \",\"password\":\"x\"}"))
                .andExpect(status().isOk());
        assertEquals("a@x.com", captor.getValue().email());
    }

    // ---------- khoa dang nhap ----------

    @Test
    void dangNhapBiKhoa_429_kemRetryAfter() throws Exception {
        when(authService.login(any(), anyString()))
                .thenThrow(ApiException.tooManyRequests("Thử lại sau", Duration.ofMinutes(15)));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@x.com\",\"password\":\"x\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string(HttpHeaders.RETRY_AFTER, "900"));
    }

    // ---------- CORS ----------

    @Test
    void cors_preflightPatch_choPhepFrontend() throws Exception {
        mvc.perform(options("/api/cv/1/review-status")
                        .header(HttpHeaders.ORIGIN, FRONTEND)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PATCH")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, containsString("PATCH")));
    }

    @Test
    void cors_originLa_biChan() throws Exception {
        mvc.perform(options("/api/jobs")
                        .header(HttpHeaders.ORIGIN, "https://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());
    }
}

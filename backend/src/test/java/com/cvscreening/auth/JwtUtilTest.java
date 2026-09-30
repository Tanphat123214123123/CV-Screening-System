package com.cvscreening.auth;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private static final String SECRET = "test-secret-key-dai-it-nhat-32-byte-cho-hs256!!";

    private static JwtUtil jwt(String secret, long expirationMs, String... profiles) {
        var env = new MockEnvironment();
        env.setActiveProfiles(profiles);
        return new JwtUtil(secret, expirationMs, env);
    }

    @Test
    void tokenHopLe_traVeEmail() {
        var util = jwt(SECRET, 60_000);

        assertEquals(Optional.of("a@test.com"), util.validSubject(util.generateToken("a@test.com", "HR")));
    }

    @Test
    void tokenHetHan_rong() {
        var util = jwt(SECRET, -60_000);

        assertTrue(util.validSubject(util.generateToken("a@test.com", "HR")).isEmpty());
    }

    @Test
    void tokenKyBangKhoaKhac_rong() {
        String forged = jwt("mot-secret-khac-hoan-toan-dai-hon-32-byte!!", 60_000).generateToken("a@test.com", "HR");

        assertTrue(jwt(SECRET, 60_000).validSubject(forged).isEmpty());
    }

    @Test
    void chuoiRac_rong() {
        var util = jwt(SECRET, 60_000);

        assertTrue(util.validSubject("abc.def.ghi").isEmpty());
        assertTrue(util.validSubject("").isEmpty());
    }

    @Test
    void secretQuaNgan_khongKhoiDong() {
        assertThrows(IllegalStateException.class, () -> jwt("ngan", 60_000));
    }

    @Test
    void profileProd_dungSecretMacDinh_khongKhoiDong() {
        assertThrows(IllegalStateException.class, () -> jwt(JwtUtil.DEFAULT_DEV_SECRET, 60_000, "prod"));
    }

    @Test
    void profileDev_dungSecretMacDinh_chiCanhBao() {
        assertDoesNotThrow(() -> jwt(JwtUtil.DEFAULT_DEV_SECRET, 60_000));
    }
}

package com.cvscreening.auth;

import com.cvscreening.user.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Doc JWT tu header Authorization va gan Authentication vao SecurityContext.
 *
 * Token thieu/sai/het han: filter KHONG tu tra loi ma de request di tiep voi trang thai chua xac thuc;
 * endpoint can dang nhap se bi RestAuthErrorHandlers tra 401. Principal la AppUserDetails (chua ca
 * entity User) nen controller lay user qua @AuthenticationPrincipal, khong query DB lan thu hai.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwtUtil.validSubject(header.substring(BEARER_PREFIX.length()))
                    .ifPresent(email -> authenticate(email, request));
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(String email, HttpServletRequest request) {
        try {
            UserDetails userDetails = userService.loadUserByUsername(email);
            var auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (UsernameNotFoundException e) {
            // Token con han nhung user da bi xoa: de chua xac thuc -> 401 o buoc authorization
            log.debug("JWT hợp lệ nhưng người dùng không còn tồn tại: {}", e.getMessage());
        }
    }
}

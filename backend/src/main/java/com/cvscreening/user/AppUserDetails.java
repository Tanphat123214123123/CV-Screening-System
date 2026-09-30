package com.cvscreening.user;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Principal trong SecurityContext, boc entity User da load o JwtAuthFilter.
 * Controller nhan qua {@code @AuthenticationPrincipal AppUserDetails me} -> {@code me.user()},
 * khong can query lai DB theo email (truoc day moi request query user 2 lan).
 */
public record AppUserDetails(User user) implements UserDetails {

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }
}

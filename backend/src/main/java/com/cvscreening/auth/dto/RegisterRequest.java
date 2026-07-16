package com.cvscreening.auth.dto;

import com.cvscreening.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Ho ten khong duoc de trong") String fullName,
        @NotBlank @Email(message = "Email khong hop le") String email,
        @NotBlank @Size(min = 6, message = "Mat khau toi thieu 6 ky tu") String password,
        @NotNull(message = "Vai tro khong duoc de trong") Role role
) {}

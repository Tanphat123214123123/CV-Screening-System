package com.cvscreening.auth.dto;

import com.cvscreening.user.Emails;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Khong kiem tra do dai toi thieu o day: tai khoan demo cu co mat khau ngan hon chinh sach moi. */
public record LoginRequest(
        @NotBlank(message = "Email không được để trống.")
        @Email(message = "Email không hợp lệ.")
        @Size(max = 254, message = "Email không hợp lệ.")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống.")
        @Size(max = 200, message = "Mật khẩu không hợp lệ.")
        String password
) {
    /** Chuan hoa TRUOC validate (Jackson goi constructor nay): " A@x.com " khong bi @Email tu choi. */
    public LoginRequest {
        email = Emails.normalize(email);
    }
}

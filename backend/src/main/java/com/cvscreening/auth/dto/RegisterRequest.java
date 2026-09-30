package com.cvscreening.auth.dto;

import com.cvscreening.user.Emails;
import com.cvscreening.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Gioi han do dai khop voi cot DB (varchar 255) — vuot qua thi bao 400 ro rang
 * thay vi de PostgreSQL nem loi "value too long" thanh 500.
 *
 * @param hrInviteCode bat buoc khi role = HR (xem app.auth.hr-invite-code)
 */
public record RegisterRequest(
        @NotBlank(message = "Họ tên không được để trống.")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự.")
        String fullName,

        @NotBlank(message = "Email không được để trống.")
        @Email(message = "Email không hợp lệ.")
        @Size(max = 254, message = "Email tối đa 254 ký tự.")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống.")
        @Size(min = 8, max = 72, message = "Mật khẩu phải dài từ 8 đến 72 ký tự.")
        String password,

        @NotNull(message = "Vai trò không được để trống.")
        Role role,

        @Size(max = 100, message = "Mã mời không hợp lệ.")
        String hrInviteCode
) {
    /** Chuan hoa TRUOC validate (Jackson goi constructor nay): " A@x.com " khong bi @Email tu choi. */
    public RegisterRequest {
        email = Emails.normalize(email);
        fullName = fullName == null ? null : fullName.trim();
    }
}

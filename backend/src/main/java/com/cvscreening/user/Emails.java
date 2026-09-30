package com.cvscreening.user;

import java.util.Locale;

/**
 * Chuan hoa email truoc khi LUU va truoc khi TRA CUU: "  Hr@Demo.com " va "hr@demo.com" la mot tai khoan.
 * DB co them CHECK ck_users_email_normalized de khong ai ghi email chua chuan hoa (ke ca ngoai code nay).
 */
public final class Emails {

    private Emails() {
    }

    public static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}

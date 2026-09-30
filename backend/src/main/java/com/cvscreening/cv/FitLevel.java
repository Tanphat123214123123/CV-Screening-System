package com.cvscreening.cv;

/**
 * Muc do phu hop hien cho UNG VIEN thay vi diem so tho.
 *
 * Ung vien khong thay con so 0-100: diem thap de gay nan / khuyen khich nhoi tu khoa vao CV,
 * trong khi thu ung vien can la biet minh dang o dau va nen bo sung gi. Diem chi tiet danh cho HR.
 * Nguong khop voi frontend (lib/score.ts) va "phu hop cao" tren dashboard HR.
 */
public enum FitLevel {
    HIGH,
    MEDIUM,
    LOW;

    public static final double HIGH_MIN_SCORE = 70.0;
    public static final double MEDIUM_MIN_SCORE = 40.0;

    /** null khi CV chua duoc cham (PENDING / FAILED). */
    public static FitLevel of(Double score) {
        if (score == null) return null;
        if (score >= HIGH_MIN_SCORE) return HIGH;
        if (score >= MEDIUM_MIN_SCORE) return MEDIUM;
        return LOW;
    }
}

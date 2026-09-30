package com.cvscreening.exception;

import org.springframework.dao.DataIntegrityViolationException;

import java.sql.SQLException;
import java.util.Locale;
import java.util.Optional;

/**
 * Doc chi tiet loi rang buoc tu DataIntegrityViolationException.
 *
 * Ly do ton tai: KHONG duoc coi moi DataIntegrityViolationException la "trung du lieu".
 * Cung mot exception co the la vi pham unique (23505), vuot do dai cot (22001), sai khoa ngoai (23503)...
 * Ten constraint duoc dat co dinh trong migration Flyway (vd uk_cvs_candidate_job) de code so khop.
 */
public final class DbConstraints {

    public static final String UK_USERS_EMAIL = "uk_users_email";
    public static final String UK_CVS_CANDIDATE_JOB = "uk_cvs_candidate_job";

    /** SQLState chuan cua PostgreSQL. */
    public static final String UNIQUE_VIOLATION = "23505";
    public static final String FOREIGN_KEY_VIOLATION = "23503";
    public static final String CHECK_VIOLATION = "23514";
    public static final String STRING_TOO_LONG = "22001";

    private DbConstraints() {
    }

    /** true neu loi la do vi pham dung constraint co ten {@code constraintName}. */
    public static boolean isViolationOf(Throwable error, String constraintName) {
        return constraintName(error)
                .map(name -> name.equalsIgnoreCase(constraintName))
                .orElse(false);
    }

    /** Ten constraint bi vi pham (neu driver/Hibernate cung cap). */
    public static Optional<String> constraintName(Throwable error) {
        for (Throwable t = error; t != null; t = t.getCause()) {
            if (t instanceof org.hibernate.exception.ConstraintViolationException cve
                    && cve.getConstraintName() != null) {
                return Optional.of(cve.getConstraintName().toLowerCase(Locale.ROOT));
            }
        }
        return Optional.empty();
    }

    /** SQLState goc tu JDBC driver, vd "23505". */
    public static Optional<String> sqlState(Throwable error) {
        for (Throwable t = error; t != null; t = t.getCause()) {
            if (t instanceof SQLException sql && sql.getSQLState() != null) {
                return Optional.of(sql.getSQLState());
            }
        }
        return Optional.empty();
    }

    public static boolean isUniqueViolation(DataIntegrityViolationException error) {
        return sqlState(error).map(UNIQUE_VIOLATION::equals).orElse(false);
    }
}

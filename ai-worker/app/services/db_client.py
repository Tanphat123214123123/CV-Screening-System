"""Doc thong tin Job va ghi ket qua cham diem vao PostgreSQL.

Worker dung chung database voi backend Spring Boot.
Ten bang/cot theo naming strategy mac dinh cua Hibernate (snake_case).
"""
from datetime import datetime, timezone

from sqlalchemy import create_engine, text

from app import config

engine = create_engine(config.DATABASE_URL, pool_pre_ping=True)


def get_job(job_id: int) -> dict | None:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, title, description, required_skills FROM jobs WHERE id = :id"),
            {"id": job_id},
        ).mappings().first()
        return dict(row) if row else None


def save_match_result(cv_id: int, job_id: int, score: float,
                      matched_skills: str, missing_skills: str,
                      summary: str, years_experience: int) -> None:
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO match_results
                    (cv_id, job_id, score, matched_skills, missing_skills,
                     summary, years_experience, created_at)
                VALUES
                    (:cv_id, :job_id, :score, :matched, :missing,
                     :summary, :years, :created_at)
                ON CONFLICT (cv_id) DO UPDATE SET
                    score = EXCLUDED.score,
                    matched_skills = EXCLUDED.matched_skills,
                    missing_skills = EXCLUDED.missing_skills,
                    summary = EXCLUDED.summary,
                    years_experience = EXCLUDED.years_experience,
                    created_at = EXCLUDED.created_at
            """),
            {
                "cv_id": cv_id, "job_id": job_id, "score": score,
                "matched": matched_skills, "missing": missing_skills,
                "summary": summary, "years": years_experience,
                "created_at": datetime.now(timezone.utc),
            },
        )


def update_cv_status(cv_id: int, status: str) -> None:
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE cvs SET status = :status WHERE id = :id"),
            {"status": status, "id": cv_id},
        )

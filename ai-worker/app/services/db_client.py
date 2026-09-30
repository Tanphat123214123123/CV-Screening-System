"""Doc thong tin Job va ghi ket qua cham diem vao PostgreSQL.

Worker dung chung database voi backend Spring Boot.
Ten bang/cot theo naming strategy mac dinh cua Hibernate (snake_case).
"""
from datetime import UTC, datetime

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
                "created_at": datetime.now(UTC),
            },
        )


def sync_skill_keywords(skills: list[str]) -> None:
    """Ghi tu dien ky nang cua worker vao bang skill_keywords (backend doc de canh bao HR).

    Chay trong 1 transaction: xoa ky nang khong con trong tu dien, them ky nang moi.
    Bang do Flyway cua backend tao - neu backend chua migrate xong thi nem loi, goi lai sau.
    """
    normalized = sorted({s.strip().lower() for s in skills if s.strip()})
    with engine.begin() as conn:
        conn.execute(
            text("DELETE FROM skill_keywords WHERE NOT (skill = ANY(:skills))"),
            {"skills": normalized},
        )
        conn.execute(
            text("""
                INSERT INTO skill_keywords (skill, synced_at) VALUES (:skill, now())
                ON CONFLICT (skill) DO UPDATE SET synced_at = EXCLUDED.synced_at
            """),
            [{"skill": s} for s in normalized],
        )


def update_cv_status(cv_id: int, status: str) -> None:
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE cvs SET status = :status WHERE id = :id"),
            {"status": status, "id": cv_id},
        )

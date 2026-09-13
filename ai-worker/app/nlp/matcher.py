"""So khop ky nang trong CV voi ky nang yeu cau cua Job Description."""


def _tokens(skill: str) -> set[str]:
    """Tach ky nang thanh tap cac tu (vd 'spring boot' -> {'spring', 'boot'})."""
    return set(skill.split())


def match_skills(cv_skills: list[str], required_skills_raw: str) -> dict:
    """
    required_skills_raw: chuoi tu bang jobs, vd "Java, Spring Boot, SQL"
    Tra ve: matched (list), missing (list), coverage (0..1)
    """
    required = [s.strip().lower() for s in required_skills_raw.split(",") if s.strip()]
    cv_set = {s.lower() for s in cv_skills}

    matched, missing = [], []
    for req in required:
        req_tokens = _tokens(req)
        # Khop truc tiep, hoac khop mot phan theo QUAN HE TU-CON THUC SU
        # (vd "spring boot" chua tron ven tu "spring") — KHONG dung substring
        # ky tu tho vi de gay nham lan nghiem trong: "java" la substring cua
        # "javascript", "go" la substring cua "django"/"mongodb"/"google cloud".
        is_match = any(
            s == req or req_tokens <= _tokens(s) or _tokens(s) <= req_tokens
            for s in cv_set
        )
        if is_match:
            matched.append(req)
        else:
            missing.append(req)

    coverage = len(matched) / len(required) if required else 0.0
    return {"matched": matched, "missing": missing, "coverage": coverage}

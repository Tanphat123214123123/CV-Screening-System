"""Cham diem muc do phu hop cua CV voi Job Description.

Cong thuc (rule-based, de giai thich truoc hoi dong):
    score = coverage * 80 + min(years, 5) * 4
- Do phu ky nang chiem toi da 80 diem (yeu to quan trong nhat)
- Kinh nghiem chiem toi da 20 diem (5 nam tro len = diem toi da)
"""


def compute_score(coverage: float, years_experience: int) -> float:
    skill_points = coverage * 80.0
    exp_points = min(max(years_experience, 0), 5) * 4.0
    return round(skill_points + exp_points, 1)


def build_summary(profile: dict, match: dict, score: float) -> str:
    matched = ", ".join(match["matched"]) if match["matched"] else "khong co"
    missing = ", ".join(match["missing"]) if match["missing"] else "khong co"
    return (
        f"Diem phu hop: {score}/100. "
        f"Ky nang trung khop: {matched}. "
        f"Ky nang con thieu: {missing}. "
        f"Kinh nghiem uoc tinh: {profile['years_experience']} nam."
    )

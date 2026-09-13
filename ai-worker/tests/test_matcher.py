"""Regression test: matcher khong duoc nham lan cac ky nang khong lien quan
chi vi chung tinh co chua chung ky tu con (vd "java" la substring cua
"javascript", "go" la substring cua "django"/"mongodb")."""
from app.nlp import matcher


def test_java_khong_match_javascript():
    result = matcher.match_skills(["javascript"], "Java")
    assert "java" in result["missing"]
    assert "java" not in result["matched"]


def test_go_khong_match_django_mongodb_google_cloud():
    result = matcher.match_skills(["django", "mongodb", "google cloud"], "Go")
    assert "go" in result["missing"]
    assert result["coverage"] == 0.0


def test_van_giu_duoc_khop_theo_ho_ky_nang():
    # "spring boot" chua tron ven tu "spring" -> van duoc tinh la mot phan
    result = matcher.match_skills(["spring boot"], "Spring, Java")
    assert "spring" in result["matched"]
    assert "java" in result["missing"]


def test_khop_chinh_xac_van_hoat_dong():
    result = matcher.match_skills(["java", "postgresql", "docker"], "Java, PostgreSQL, AWS")
    assert set(result["matched"]) == {"java", "postgresql"}
    assert result["missing"] == ["aws"]
    assert result["coverage"] == 2 / 3

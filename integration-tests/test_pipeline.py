"""Integration test end-to-end: upload -> S3 -> SQS -> AI worker -> Postgres -> HR.

Moi test o day kiem nhung thu unit test (mock) khong bat duoc: cac service
that phoi hop voi nhau, phan quyen qua JWT, CORS cua trinh duyet.
"""
import requests

from conftest import API, FRONTEND_ORIGIN, docx_cv, upload, wait_until_processed

JOB = {
    "title": "Integration Java Backend",
    "description": "Tin tao boi integration test",
    "requiredSkills": "Java, Spring Boot, Docker, AWS",
    "location": "CI",
}


def create_job(hr) -> int:
    r = hr.post("/jobs", json=JOB)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_luong_chinh_nop_cv_ai_cham_diem_hr_shortlist(hr, candidate):
    job_id = create_job(hr)

    # 1) Ung vien nop CV -> backend luu S3 + gui SQS, tra PENDING ngay
    cv_text = "Nguyen Van Test\n4 years experience\nSkills: Java, Spring Boot, Docker, PostgreSQL"
    r = upload(candidate, job_id, "cv.docx", docx_cv(cv_text))
    assert r.status_code == 202, r.text
    cv_id = r.json()["cvId"]
    assert r.json()["status"] == "PENDING"

    # 2) AI worker nhan message, tai file tu S3, cham diem, ghi Postgres
    app = wait_until_processed(candidate, cv_id)
    assert app["status"] == "PROCESSED", "worker danh dau FAILED - xem log ai-worker"
    # 3/4 ky nang (thieu AWS) * 80 + 4 nam * 4 = 76
    assert app["score"] == 76.0
    assert set(app["matchedSkills"].split(", ")) == {"java", "spring boot", "docker"}
    assert app["missingSkills"] == "aws"

    # 3) HR thay ung vien, kem diem + trang thai xu ly mac dinh NEW
    candidates = hr.get(f"/matching/job/{job_id}").json()
    assert [(c["cvId"], c["score"], c["reviewStatus"]) for c in candidates] == [(cv_id, 76.0, "NEW")]

    # 4) HR shortlist -> dashboard cap nhat so lieu
    assert hr.patch(f"/cv/{cv_id}/review-status", json={"status": "SHORTLISTED"}).status_code == 204
    stats = next(j for j in hr.get("/jobs/mine").json() if j["id"] == job_id)
    assert stats["applicantCount"] == 1
    assert stats["pendingCount"] == 0
    assert stats["strongCount"] == 1
    assert stats["shortlistedCount"] == 1
    assert stats["averageScore"] == 76.0

    # 5) HR chu tin lay duoc presigned URL tai CV
    url = hr.get(f"/cv/{cv_id}/download").json()["url"]
    assert "X-Amz-Signature" in url


def test_hr_khac_khong_xem_duoc_ung_vien_va_khong_thay_tin(hr, other_hr, candidate):
    job_id = create_job(hr)
    cv_id = upload(candidate, job_id, "cv.docx", docx_cv("Java")).json()["cvId"]

    assert other_hr.get(f"/matching/job/{job_id}").status_code == 403
    assert other_hr.patch(f"/cv/{cv_id}/review-status", json={"status": "REJECTED"}).status_code == 403
    assert other_hr.get(f"/cv/{cv_id}/download").status_code == 403
    assert job_id not in [j["id"] for j in other_hr.get("/jobs/mine").json()]


def test_dong_tin_van_xem_duoc_va_mo_lai(hr, candidate):
    job_id = create_job(hr)
    assert hr.session.delete(f"{API}/jobs/{job_id}").status_code == 204

    # Tin da dong: ung vien khong thay / khong nop duoc, HR van thay trong /mine
    assert job_id not in [j["id"] for j in candidate.get("/jobs").json()]
    assert upload(candidate, job_id, "cv.docx", docx_cv("Java")).status_code == 404
    mine = {j["id"]: j for j in hr.get("/jobs/mine").json()}
    assert mine[job_id]["active"] is False

    assert hr.post(f"/jobs/{job_id}/reopen").status_code == 204
    assert upload(candidate, job_id, "cv.docx", docx_cv("Java")).status_code == 202


def test_tu_choi_file_sai_dinh_dang_va_nop_trung(hr, candidate):
    job_id = create_job(hr)
    assert upload(candidate, job_id, "virus.exe", b"MZ", "application/octet-stream").status_code == 400
    assert upload(candidate, job_id, "cv.docx", docx_cv("Java")).status_code == 202
    assert upload(candidate, job_id, "cv2.docx", docx_cv("Java")).status_code == 409


def test_phan_quyen_theo_vai_tro(hr, candidate):
    assert requests.get(f"{API}/jobs/mine", timeout=10).status_code in (401, 403)
    assert candidate.get("/jobs/mine").status_code == 403
    assert candidate.post("/jobs", json=JOB).status_code == 403
    assert hr.get("/cv/mine").status_code == 403


def test_cors_cho_phep_frontend_goi_patch():
    """Regression: CORS tung thieu PATCH -> trinh duyet chan nut Shortlist
    ("Khong ket noi duoc may chu") du unit test van xanh."""
    r = requests.options(
        f"{API}/cv/1/review-status",
        headers={
            "Origin": FRONTEND_ORIGIN,
            "Access-Control-Request-Method": "PATCH",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
        timeout=10,
    )
    assert r.status_code == 200, r.text
    assert r.headers.get("Access-Control-Allow-Origin") == FRONTEND_ORIGIN
    assert "PATCH" in r.headers.get("Access-Control-Allow-Methods", "")

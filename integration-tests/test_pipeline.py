"""Integration test end-to-end: upload -> S3 -> SQS -> AI worker -> Postgres -> HR.

Moi test o day kiem nhung thu unit test (mock) khong bat duoc: cac service
that phoi hop voi nhau, phan quyen qua JWT, CORS cua trinh duyet.
"""
import time
import uuid

import requests

from conftest import (
    API,
    BLANK_PDF,
    FRONTEND_ORIGIN,
    HR_INVITE_CODE,
    docx_cv,
    hr_view,
    register_raw,
    upload,
    wait_until_processed,
)

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
    # Ung vien chi thay muc phu hop, KHONG thay diem so (diem danh cho HR)
    assert "score" not in app
    assert app["fitLevel"] == "HIGH"
    assert app["reviewStatus"] == "NEW"
    assert set(app["matchedSkills"].split(", ")) == {"java", "spring boot", "docker"}
    assert app["missingSkills"] == "aws"

    # 3) HR thay ung vien, kem diem + trang thai xu ly mac dinh NEW. 3/4 ky nang * 80 + 4 nam * 4 = 76
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

    # 5) HR chu tin lay presigned URL va TAI DUOC THAT tu may ngoai Docker (nhu trinh duyet).
    #    Regression: URL tung ky voi host noi bo "minio:9000" -> trinh duyet khong mo duoc.
    url = hr.get(f"/cv/{cv_id}/download").json()["url"]
    assert "X-Amz-Signature" in url
    file = requests.get(url, timeout=15)
    assert file.status_code == 200, f"{url} -> {file.status_code}"
    assert file.content[:2] == b"PK", "file tai ve khong phai DOCX da upload"


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
    # Chua dang nhap / token het han PHAI la 401: frontend chi dua ve trang dang nhap khi nhan 401
    assert requests.get(f"{API}/jobs/mine", timeout=10).status_code == 401
    bad_token = {"Authorization": "Bearer abc.def.ghi"}
    assert requests.get(f"{API}/jobs/mine", timeout=10, headers=bad_token).status_code == 401
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


def test_dang_ky_hr_bat_buoc_ma_moi():
    """Regression: ai cung tu dang ky duoc tai khoan HR va doc CV (du lieu ca nhan) cua ung vien."""
    assert register_raw("HR").status_code == 403
    assert register_raw("HR", "doan-bua").status_code == 403
    assert register_raw("HR", HR_INVITE_CODE).status_code == 201
    assert register_raw("CANDIDATE").status_code == 201


def test_email_khong_phan_biet_hoa_thuong():
    email = f"Mixed-{uuid.uuid4().hex[:8]}@Example.COM"
    assert register_raw("CANDIDATE", email=email).status_code == 201
    assert register_raw("CANDIDATE", email=email.lower()).status_code == 409
    r = requests.post(f"{API}/auth/login", timeout=15,
                      json={"email": "  " + email.upper() + " ", "password": "secret123"})
    assert r.status_code == 200, r.text


def test_doi_ky_nang_jd_thi_cham_lai_toan_bo_cv(hr, candidate):
    """Regression: sua JD khong cham lai -> bang xep hang tron diem cua nhieu phien ban JD."""
    job_id = create_job(hr)
    cv_text = "4 years experience\nSkills: Java, Spring Boot, Docker"
    cv_id = upload(candidate, job_id, "cv.docx", docx_cv(cv_text)).json()["cvId"]
    wait_until_processed(candidate, cv_id)
    assert hr_view(hr, job_id, cv_id)["score"] == 76.0   # thieu AWS

    updated = {**JOB, "requiredSkills": "Java, Docker"}
    assert hr.put(f"/jobs/{job_id}", json=updated).status_code == 200

    rescored = wait_until_processed(candidate, cv_id)
    assert rescored["status"] == "PROCESSED"
    assert hr_view(hr, job_id, cv_id)["score"] == 96.0   # du 2/2 ky nang * 80 + 4 nam * 4
    assert rescored["missingSkills"] in ("", None)


def test_file_doi_duoi_bi_tu_choi_truoc_khi_len_s3(hr, candidate):
    job_id = create_job(hr)
    r = upload(candidate, job_id, "cv.pdf", b"MZ\x90\x00 day la file exe", "application/pdf")
    assert r.status_code == 400
    assert "định dạng" in r.json()["message"]
    # Upload loi khong duoc "chiem cho": nop lai file dung van thanh cong
    assert upload(candidate, job_id, "cv.docx", docx_cv("Java")).status_code == 202


def test_loi_chuan_tra_dung_ma_http(hr):
    assert hr.get("/khong-ton-tai").status_code == 404
    assert hr.session.put(f"{API}/jobs", timeout=10).status_code == 405
    too_long = {**JOB, "title": "A" * 300}
    r = hr.post("/jobs", json=too_long)
    assert r.status_code == 400
    assert "title" in r.json()["fieldErrors"]


def test_cv_ai_khong_doc_duoc_thi_nop_lai_duoc(hr, candidate):
    """Regression UX: CV FAILED tung la ngo cut - nop lai bi 409 "da nop roi" vinh vien."""
    job_id = create_job(hr)
    cv_id = upload(candidate, job_id, "scan.pdf", BLANK_PDF, "application/pdf").json()["cvId"]
    assert wait_until_processed(candidate, cv_id)["status"] == "FAILED"
    # HR loai ho so hong (duoc phep voi CV FAILED)
    assert hr.patch(f"/cv/{cv_id}/review-status", json={"status": "REJECTED"}).status_code == 204

    new_cv = docx_cv("4 years experience\nSkills: Java, Spring Boot, Docker")
    r = upload(candidate, job_id, "cv-moi.docx", new_cv)
    assert r.status_code == 202, r.text
    assert r.json()["cvId"] == cv_id, "cap nhat ho so cu, khong tao ho so thu hai"

    app = wait_until_processed(candidate, cv_id)
    assert app["status"] == "PROCESSED"
    assert app["fileName"] == "cv-moi.docx"
    # Quyet dinh cu dua tren file hong bi xoa
    assert app["reviewStatus"] == "NEW"
    assert hr_view(hr, job_id, cv_id)["score"] == 76.0
    assert len(hr.get(f"/matching/job/{job_id}").json()) == 1

    # Da cham xong thi khong nop lai duoc nua
    assert upload(candidate, job_id, "cv3.docx", docx_cv("Java")).status_code == 409


def test_tu_dien_ky_nang_do_worker_dong_bo(hr, candidate):
    """Worker ghi SKILL_KEYWORDS vao DB luc khoi dong; backend tra ra cho form dang tin canh bao HR."""
    deadline = time.time() + 60
    skills = []
    while time.time() < deadline:
        skills = hr.get("/skills").json()["skills"]
        if skills:
            break
        time.sleep(2)
    assert {"java", "spring boot", "docker", "aws"} <= set(skills)
    assert "tiếng anh" not in skills
    assert skills == sorted(skills)
    assert candidate.get("/skills").status_code == 403

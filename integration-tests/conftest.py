"""Fixture dung chung cho integration test.

Test chay tren he thong that (docker compose --profile app): backend + AI worker +
Postgres + MinIO + ElasticMQ. Moi lan chay tao user/tin moi (email ngau nhien)
nen khong phu thuoc du lieu co san va chay lai nhieu lan duoc.
"""
import io
import os
import time
import uuid

import pytest
import requests
from docx import Document

API = os.getenv("API_URL", "http://localhost:8080/api")
HEALTH_URL = os.getenv("HEALTH_URL", API.removesuffix("/api") + "/actuator/health")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
STARTUP_TIMEOUT = int(os.getenv("STARTUP_TIMEOUT", "180"))
# Khop gia tri mac dinh cua app.auth.hr-invite-code (application.yml)
HR_INVITE_CODE = os.getenv("HR_INVITE_CODE", "HR-DEMO-2026")


class Client:
    """requests.Session gan san JWT cua mot user."""

    def __init__(self, token: str, email: str):
        self.email = email
        self.session = requests.Session()
        self.session.headers["Authorization"] = f"Bearer {token}"

    def get(self, path, **kw):
        return self.session.get(f"{API}{path}", timeout=15, **kw)

    def post(self, path, **kw):
        return self.session.post(f"{API}{path}", timeout=30, **kw)

    def put(self, path, **kw):
        return self.session.put(f"{API}{path}", timeout=15, **kw)

    def patch(self, path, **kw):
        return self.session.patch(f"{API}{path}", timeout=15, **kw)


@pytest.fixture(scope="session", autouse=True)
def backend_ready():
    """Doi backend UP that su (DB + migration Flyway xong) qua /actuator/health."""
    deadline = time.time() + STARTUP_TIMEOUT
    last_error = None
    while time.time() < deadline:
        try:
            r = requests.get(HEALTH_URL, timeout=3)
            if r.status_code == 200 and r.json().get("status") == "UP":
                return
            last_error = f"HTTP {r.status_code}: {r.text[:200]}"
        except requests.RequestException as exc:
            last_error = exc
        time.sleep(3)
    pytest.fail(f"Backend khong san sang sau {STARTUP_TIMEOUT}s: {last_error}")


def register_raw(role: str, invite_code: str | None = None, email: str | None = None):
    email = email or f"it-{role.lower()}-{uuid.uuid4().hex[:10]}@example.com"
    body = {"fullName": f"Integration {role}", "email": email, "password": "secret123", "role": role}
    if invite_code is not None:
        body["hrInviteCode"] = invite_code
    return requests.post(f"{API}/auth/register", timeout=15, json=body)


def register(role: str) -> Client:
    r = register_raw(role, HR_INVITE_CODE if role == "HR" else None)
    assert r.status_code == 201, r.text
    return Client(r.json()["token"], r.json()["email"])


@pytest.fixture
def hr() -> Client:
    return register("HR")


@pytest.fixture
def other_hr() -> Client:
    return register("HR")


@pytest.fixture
def candidate() -> Client:
    return register("CANDIDATE")


def docx_cv(text: str) -> bytes:
    doc = Document()
    for line in text.splitlines():
        doc.add_paragraph(line)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def upload(client: Client, job_id: int, name: str, content: bytes, mime: str = DOCX_MIME):
    return client.post("/cv/upload", data={"jobId": job_id}, files={"file": (name, content, mime)})


def hr_view(hr: Client, job_id: int, cv_id: int) -> dict:
    """Dong ung vien trong man hinh xet duyet cua HR (co diem so - ung vien chi thay fitLevel)."""
    return next(c for c in hr.get(f"/matching/job/{job_id}").json() if c["cvId"] == cv_id)


# PDF hop le ve cau truc (qua kiem tra header o backend) nhung trang trang, khong co chu nao
# -> AI worker khong trich duoc noi dung -> FAILED. Mo phong CV la anh scan.
BLANK_PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n"
    b"trailer<</Root 1 0 R>>\n%%EOF\n"
)


def wait_until_processed(client: Client, cv_id: int, timeout: int = 90) -> dict:
    """Poll /cv/mine den khi AI worker xu ly xong CV (het PENDING)."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        apps = client.get("/cv/mine").json()
        app = next(a for a in apps if a["cvId"] == cv_id)
        if app["status"] != "PENDING":
            return app
        time.sleep(2)
    pytest.fail(f"CV #{cv_id} van PENDING sau {timeout}s - worker khong xu ly duoc message")

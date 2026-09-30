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
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
STARTUP_TIMEOUT = int(os.getenv("STARTUP_TIMEOUT", "180"))


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

    def patch(self, path, **kw):
        return self.session.patch(f"{API}{path}", timeout=15, **kw)


@pytest.fixture(scope="session", autouse=True)
def backend_ready():
    """Doi backend khoi dong xong (build + migrate schema co the mat vai chuc giay)."""
    deadline = time.time() + STARTUP_TIMEOUT
    last_error = None
    while time.time() < deadline:
        try:
            if requests.get(f"{API}/jobs", timeout=3).status_code < 500:
                return
        except requests.RequestException as exc:
            last_error = exc
        time.sleep(3)
    pytest.fail(f"Backend khong san sang sau {STARTUP_TIMEOUT}s: {last_error}")


def register(role: str) -> Client:
    email = f"it-{role.lower()}-{uuid.uuid4().hex[:10]}@example.com"
    r = requests.post(f"{API}/auth/register", timeout=15, json={
        "fullName": f"Integration {role}", "email": email, "password": "secret123", "role": role,
    })
    assert r.status_code == 201, r.text
    return Client(r.json()["token"], email)


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

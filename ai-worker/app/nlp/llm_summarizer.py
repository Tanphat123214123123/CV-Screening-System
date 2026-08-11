"""(Tuy chon) Dung LLM de sinh nhan xet chi tiet ve CV.

Chi chay khi bien moi truong ANTHROPIC_API_KEY duoc thiet lap.
Neu goi API loi -> tu dong fallback ve summary rule-based, pipeline khong bi gian doan.
"""
import json

import requests

from app import config

API_URL = "https://api.anthropic.com/v1/messages"
# Haiku: nhiem vu chi la tom tat 2-3 cau, khong can model manh -> re va nhanh hon dang ke.
MODEL = "claude-haiku-4-5"

PROMPT_TEMPLATE = """Ban la chuyen gia tuyen dung. Danh gia muc do phu hop giua CV va JD sau.

## Job Description
Tieu de: {job_title}
Mo ta: {job_description}
Ky nang yeu cau: {required_skills}

## Noi dung CV (da trich xuat)
{cv_text}

Tra ve DUY NHAT mot JSON (khong markdown, khong giai thich them) dang:
{{"summary": "<nhan xet 2-3 cau bang tieng Viet ve diem manh/yeu cua ung vien so voi JD>"}}"""


def generate_summary(job: dict, cv_text: str) -> str | None:
    if not config.ANTHROPIC_API_KEY:
        return None
    try:
        response = requests.post(
            API_URL,
            headers={
                "x-api-key": config.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": MODEL,
                "max_tokens": 500,
                "messages": [{
                    "role": "user",
                    "content": PROMPT_TEMPLATE.format(
                        job_title=job["title"],
                        job_description=job["description"][:2000],
                        required_skills=job["required_skills"],
                        cv_text=cv_text[:6000],
                    ),
                }],
            },
            timeout=30,
        )
        response.raise_for_status()
        text = "".join(
            block.get("text", "")
            for block in response.json().get("content", [])
            if block.get("type") == "text"
        )
        data = json.loads(text.strip().removeprefix("```json").removesuffix("```").strip())
        return data.get("summary")
    except Exception as exc:  # noqa: BLE001 - fallback co chu dich
        print(f"[LLM] Loi goi API, dung summary rule-based: {exc}")
        return None

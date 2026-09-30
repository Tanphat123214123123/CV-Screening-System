"""Contract test: frontend chep lai quy tac nhan dien ky nang va cong thuc diem cua worker.

Ca hai phia chay CUNG bo du lieu contracts/ai-rules.json - xem frontend/src/lib/contracts.test.ts.
Sua matcher.py / scorer.py lam test nay do thi phai sua ca frontend/src/lib/{skills,score}.ts.
"""
import json
from pathlib import Path

import pytest

from app.nlp import matcher, scorer

RULES = json.loads((Path(__file__).resolve().parents[2] / "contracts" / "ai-rules.json").read_text("utf-8"))
RECOGNITION = RULES["skillRecognition"]


@pytest.mark.parametrize("case", RECOGNITION["cases"], ids=lambda c: c["skill"].strip())
def test_nhan_dien_ky_nang_khop_frontend(case):
    # Ky nang "nhan dien duoc" = khop khi CV chua MOI ky nang trong tu dien
    result = matcher.match_skills(RECOGNITION["dictionary"], case["skill"])
    assert (len(result["matched"]) == 1) == case["recognized"]


def _scoring_id(case: dict) -> str:
    return f"{case['matched']}-{case['missing']}-{case['years']}"


@pytest.mark.parametrize("case", RULES["scoring"]["cases"], ids=_scoring_id)
def test_cong_thuc_diem_khop_frontend(case):
    coverage = case["matched"] / (case["matched"] + case["missing"])
    assert scorer.compute_score(coverage, case["years"]) == case["score"]

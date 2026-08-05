"""AI Worker - tieu thu message tu SQS va xu ly CV bat dong bo.

Pipeline cho moi CV:
    1. Nhan message {cvId, jobId, s3Key} tu SQS
    2. Tai file CV tu S3 ve thu muc tam
    3. Parse text (PDF -> pdfplumber, DOCX -> python-docx)
    4. NLP: trich xuat ky nang, kinh nghiem (rule-based)
    5. So khop voi JD, cham diem 0-100
    6. (Tuy chon) Goi LLM sinh nhan xet chi tiet
    7. Ghi ket qua vao bang match_results, cap nhat trang thai CV
    8. Xoa message khoi queue
"""
import json
import os
import tempfile
import traceback

from app.models.schemas import CvProcessingMessage
from app.nlp import extractor, llm_summarizer, matcher, scorer
from app.parsers import docx_parser, pdf_parser
from app.services import db_client, s3_client, sqs_client


def parse_cv_file(local_path: str, file_name: str) -> str:
    ext = file_name.lower().rsplit(".", 1)[-1] if "." in file_name else ""
    if ext == "pdf":
        return pdf_parser.extract_text(local_path)
    if ext in ("docx", "doc"):
        return docx_parser.extract_text(local_path)
    raise ValueError(f"Dinh dang file khong ho tro: {ext}")


def process_message(msg: CvProcessingMessage) -> None:
    print(f"[Worker] Bat dau xu ly CV #{msg.cv_id} (job #{msg.job_id})")

    job = db_client.get_job(msg.job_id)
    if job is None:
        raise ValueError(f"Khong tim thay job #{msg.job_id}")

    # Tai file ve thu muc tam
    suffix = os.path.splitext(msg.file_name)[1] or ".pdf"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        local_path = tmp.name
    try:
        s3_client.download_file(msg.s3_key, local_path)
        cv_text = parse_cv_file(local_path, msg.file_name)
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)

    if not cv_text.strip():
        raise ValueError("Khong trich xuat duoc noi dung tu file CV")

    # NLP pipeline
    profile = extractor.extract_profile(cv_text)
    match = matcher.match_skills(profile["skills"], job["required_skills"])
    score = scorer.compute_score(match["coverage"], profile["years_experience"])

    # Uu tien nhan xet tu LLM (neu cau hinh), fallback ve rule-based
    summary = llm_summarizer.generate_summary(job, cv_text)
    if not summary:
        summary = scorer.build_summary(profile, match, score)

    db_client.save_match_result(
        cv_id=msg.cv_id,
        job_id=msg.job_id,
        score=score,
        matched_skills=", ".join(match["matched"]),
        missing_skills=", ".join(match["missing"]),
        summary=summary,
        years_experience=profile["years_experience"],
    )
    db_client.update_cv_status(msg.cv_id, "PROCESSED")
    print(f"[Worker] Hoan tat CV #{msg.cv_id}: score={score}")


def main() -> None:
    queue_url = sqs_client.get_queue_url()
    print(f"[Worker] Dang lang nghe queue: {queue_url}")

    while True:
        for message in sqs_client.receive_messages(queue_url):
            body = json.loads(message["Body"])
            msg = CvProcessingMessage.from_dict(body)
            try:
                process_message(msg)
            except Exception:
                traceback.print_exc()
                try:
                    db_client.update_cv_status(msg.cv_id, "FAILED")
                except Exception:
                    traceback.print_exc()
            finally:
                # Xoa message de tranh xu ly lap (voi do an, chap nhan at-most-once
                # sau khi da ghi FAILED; production co the dung DLQ)
                sqs_client.delete_message(queue_url, message["ReceiptHandle"])


if __name__ == "__main__":
    main()

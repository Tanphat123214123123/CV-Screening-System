"""Cau hinh AI Worker doc tu bien moi truong (12-factor app)."""
import os

from dotenv import load_dotenv

load_dotenv()

# --- AWS / MinIO / ElasticMQ ---
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "minioadmin")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin")

# De trong 2 endpoint nay khi deploy AWS that
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
SQS_ENDPOINT = os.getenv("SQS_ENDPOINT", "http://localhost:9324")

S3_BUCKET = os.getenv("S3_BUCKET", "cv-bucket")
SQS_QUEUE = os.getenv("SQS_QUEUE", "cv-processing-queue")

# --- Database (dung chung voi backend Spring Boot) ---
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/cvscreening",
)

# --- LLM (tuy chon): neu co API key, worker se dung LLM de tom tat CV ---
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

POLL_WAIT_SECONDS = int(os.getenv("POLL_WAIT_SECONDS", "10"))

"""Tai file CV tu S3 (hoac MinIO khi chay local)."""
import boto3

from app import config


def _client():
    kwargs = dict(
        region_name=config.AWS_REGION,
        aws_access_key_id=config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
    )
    if config.S3_ENDPOINT:
        kwargs["endpoint_url"] = config.S3_ENDPOINT
    return boto3.client("s3", **kwargs)


s3 = _client()


def download_file(s3_key: str, local_path: str) -> None:
    s3.download_file(config.S3_BUCKET, s3_key, local_path)

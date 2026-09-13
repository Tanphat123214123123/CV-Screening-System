"""Nhan message tu SQS (hoac ElasticMQ khi chay local)."""
import boto3

from app import config


def _client():
    kwargs = dict(
        region_name=config.AWS_REGION,
        aws_access_key_id=config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
    )
    if config.SQS_ENDPOINT:
        kwargs["endpoint_url"] = config.SQS_ENDPOINT
    return boto3.client("sqs", **kwargs)


sqs = _client()


def get_queue_url() -> str:
    # create_queue la idempotent: queue da ton tai thi tra ve URL hien co
    return sqs.create_queue(QueueName=config.SQS_QUEUE)["QueueUrl"]


def receive_messages(queue_url: str, max_messages: int = 1):
    # Worker xu ly tuan tu, moi message co the mat vai chuc giay (goi LLM).
    # Lay nhieu message mot luc de trong khi cho den luot se de bi het
    # visibility timeout va bi phat lai (xu ly trung) -> mac dinh lay tung cai mot.
    response = sqs.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=max_messages,
        WaitTimeSeconds=config.POLL_WAIT_SECONDS,  # long polling
    )
    return response.get("Messages", [])


def delete_message(queue_url: str, receipt_handle: str) -> None:
    sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)

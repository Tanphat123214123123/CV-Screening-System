"""Schema message trao doi qua SQS giua backend va worker."""
from dataclasses import dataclass


@dataclass
class CvProcessingMessage:
    cv_id: int
    job_id: int
    s3_key: str
    file_name: str

    @classmethod
    def from_dict(cls, data: dict) -> "CvProcessingMessage":
        return cls(
            cv_id=int(data["cvId"]),
            job_id=int(data["jobId"]),
            s3_key=data["s3Key"],
            file_name=data.get("fileName", ""),
        )

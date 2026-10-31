"""File storage: AWS S3 when S3_BUCKET is set, otherwise the local data/uploads folder.

Files are stored under a per-user prefix (uploads/<user_id>/...), so deleting an
account can remove everything for that user in one sweep.

boto3 picks up credentials the standard AWS way (env vars, ~/.aws/credentials,
or an IAM role when deployed on EC2/ECS) - never hardcode keys.
"""
import shutil
import uuid
from pathlib import Path

from app.config import settings


def _prefix(user_id: str) -> str:
    return f"uploads/{user_id}/"


def save_file(user_id: str, filename: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    key = f"{_prefix(user_id)}{uuid.uuid4().hex}-{Path(filename).name}"

    if settings.s3_bucket:
        import boto3

        s3 = boto3.client("s3", region_name=settings.aws_region)
        s3.put_object(Bucket=settings.s3_bucket, Key=key, Body=data, ContentType=content_type)
        return f"s3://{settings.s3_bucket}/{key}"

    path = settings.data_dir / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return str(path)


def delete_user_files(user_id: str) -> int:
    if settings.s3_bucket:
        import boto3

        bucket = boto3.resource("s3", region_name=settings.aws_region).Bucket(settings.s3_bucket)
        deleted = bucket.objects.filter(Prefix=_prefix(user_id)).delete()
        return sum(len(batch.get("Deleted", [])) for batch in deleted)

    folder = settings.data_dir / _prefix(user_id)
    count = sum(1 for p in folder.rglob("*") if p.is_file()) if folder.exists() else 0
    shutil.rmtree(folder, ignore_errors=True)
    return count

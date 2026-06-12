import os
import shutil
from app.core.config import settings

UPLOAD_DIR = "uploads/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class StorageService:
    def save_file(self, file_bytes: bytes, filename: str, content_type: str = "audio/mpeg") -> str:
        """
        Saves a file to the configured storage backend (local, s3, or supabase).
        Returns the file path or public URL.
        """
        backend = settings.STORAGE_BACKEND.lower()

        if backend == "s3":
            try:
                import boto3
                s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.S3_ACCESS_KEY,
                    aws_secret_access_key=settings.S3_SECRET_KEY,
                    region_name=settings.S3_REGION
                )
                s3_client.put_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=filename,
                    Body=file_bytes,
                    ContentType=content_type
                )
                return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.S3_REGION}.amazonaws.com/{filename}"
            except Exception as e:
                print(f"Storage Service S3 Error: {e}. Falling back to local.")
                
        elif backend == "supabase":
            # Supabase storage supports upload via HTTP POST request
            # Ref: https://supabase.com/docs/reference/api/storage-insert-object
            # We can use the service role key or anon key from environment variables or auth_config
            try:
                # If they configure s3-compatible endpoints for Supabase, it works similarly.
                # As a generic fallback or HTTP request:
                import urllib.request
                import urllib.error
                
                # Check for supabase URL and Service Key in env/settings
                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
                bucket_name = settings.S3_BUCKET_NAME or "audio"
                
                if supabase_url and supabase_key:
                    supabase_url = supabase_url.rstrip("/")
                    url = f"{supabase_url}/storage/v1/object/{bucket_name}/{filename}"
                    
                    req = urllib.request.Request(
                        url,
                        data=file_bytes,
                        headers={
                            "Authorization": f"Bearer {supabase_key}",
                            "Content-Type": content_type
                        },
                        method="POST"
                    )
                    with urllib.request.urlopen(req) as response:
                        if response.status in [200, 201]:
                            return f"{supabase_url}/storage/v1/object/public/{bucket_name}/{filename}"
            except Exception as e:
                print(f"Storage Service Supabase Error: {e}. Falling back to local.")

        # Default local fallback
        local_path = os.path.join(UPLOAD_DIR, filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return local_path

    def delete_file(self, path_or_url: str) -> bool:
        """
        Deletes a file from the configured storage backend or local directory.
        """
        if not path_or_url:
            return False

        if path_or_url.startswith(("http://", "https://")):
            # It's S3 or Supabase URL
            backend = settings.STORAGE_BACKEND.lower()
            if backend == "s3":
                try:
                    import boto3
                    filename = path_or_url.split("/")[-1]
                    s3_client = boto3.client(
                        "s3",
                        aws_access_key_id=settings.S3_ACCESS_KEY,
                        aws_secret_access_key=settings.S3_SECRET_KEY,
                        region_name=settings.S3_REGION
                    )
                    s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=filename)
                    return True
                except Exception as e:
                    print(f"Storage Service S3 delete error: {e}")
            elif backend == "supabase":
                try:
                    import urllib.request
                    supabase_url = os.getenv("SUPABASE_URL")
                    supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
                    bucket_name = settings.S3_BUCKET_NAME or "audio"
                    filename = path_or_url.split("/")[-1]
                    if supabase_url and supabase_key:
                        url = f"{supabase_url.rstrip('/')}/storage/v1/object/{bucket_name}/{filename}"
                        req = urllib.request.Request(
                            url,
                            headers={"Authorization": f"Bearer {supabase_key}"},
                            method="DELETE"
                        )
                        with urllib.request.urlopen(req) as response:
                            return response.status in [200, 204]
                except Exception as e:
                    print(f"Storage Service Supabase delete error: {e}")
            return False
        else:
            # It's a local file path
            try:
                if os.path.exists(path_or_url):
                    os.remove(path_or_url)
                    return True
            except Exception as e:
                print(f"Storage Service local delete error: {e}")
            return False

storage_service = StorageService()

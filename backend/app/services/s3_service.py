import boto3
import os

class S3Service:
    def __init__(self):
        self.client = boto3.client(
            service_name='s3',
            region_name=os.environ.get("AWS_REGION", "us-east-1")
        )
        self.bucket = os.environ.get("S3_BUCKET", "cloudyai-assets")

    def upload_file(self, file_content: bytes, object_name: str):
        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=object_name,
                Body=file_content
            )
            return True
        except Exception as e:
            print(f"Error uploading to S3: {e}")
            return False

    def get_download_url(self, object_name: str, expires_in: int = 3600):
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': object_name},
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            print(f"Error generating presigned URL: {e}")
            return None

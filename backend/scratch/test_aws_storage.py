import os
import sys

# Ensure backend root is in search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.dynamo_service import DynamoService
from app.services.s3_service import S3Service

def test_s3_and_dynamo():
    print("Initializing AWS services...")
    s3 = S3Service()
    dynamo = DynamoService()
    
    # 1. Test S3 upload
    test_content = b"Hello, CloudyAI! Test S3 upload content."
    test_key = "tests/test_upload.txt"
    print(f"Uploading to S3 bucket '{s3.bucket}' with key '{test_key}'...")
    s3_ok = s3.upload_file(test_content, test_key)
    if s3_ok:
        print("S3 upload SUCCESS!")
    else:
        print("S3 upload FAILED!")
        
    # 2. Test S3 presigned URL
    url = s3.get_download_url(test_key)
    print(f"Generated S3 presigned URL: {url}")
    
    # 3. Test DynamoDB write
    print(f"Saving to DynamoDB table '{dynamo.table.name}'...")
    dynamo_ok = dynamo.save_generation(
        user_id="test_user_123",
        title="E-commerce Cloud Architecture",
        platform="AWS",
        data={
            "nodes": [{"id": "1", "name": "API Gateway"}, {"id": "2", "name": "Lambda"}],
            "edges": [{"id": "e1-2", "source": "1", "target": "2"}],
            "s3_key": test_key
        }
    )
    if dynamo_ok:
        print("DynamoDB save SUCCESS!")
    else:
        print("DynamoDB save FAILED!")
        
    # 4. Test DynamoDB query
    print("Querying history for user 'test_user_123'...")
    history = dynamo.get_user_history("test_user_123")
    print(f"Retrieved {len(history)} items from DynamoDB:")
    for item in history:
        print(f" - Title: {item.get('title')}, Created At: {item.get('created_at')}")

if __name__ == "__main__":
    test_s3_and_dynamo()

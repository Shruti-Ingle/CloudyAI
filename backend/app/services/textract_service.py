import boto3
import os

class TextractService:
    def __init__(self):
        self.client = boto3.client(
            service_name='textract',
            region_name=os.environ.get("AWS_REGION", "us-east-1")
        )

    def extract_text_from_s3(self, bucket: str, document_name: str):
        try:
            response = self.client.detect_document_text(
                Document={
                    'S3Object': {
                        'Bucket': bucket,
                        'Name': document_name
                    }
                }
            )
            
            detected_text = ""
            for item in response['Blocks']:
                if item['BlockType'] == 'LINE':
                    detected_text += item['Text'] + "\n"
                    
            return detected_text
        except Exception as e:
            print(f"Error invoking Textract: {e}")
            return None

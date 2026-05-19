import boto3
import os
from datetime import datetime

class DynamoService:
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=os.environ.get("AWS_REGION", "us-east-1")
        )
        self.table = self.dynamodb.Table(os.environ.get("DYNAMODB_TABLE", "CloudyAI-History"))

    def save_generation(self, user_id: str, title: str, platform: str, data: dict):
        try:
            self.table.put_item(
                Item={
                    'PK': f"USER#{user_id}",
                    'SK': f"GEN#{datetime.utcnow().isoformat()}",
                    'title': title,
                    'platform': platform,
                    'data': data,
                    'created_at': datetime.utcnow().isoformat()
                }
            )
            return True
        except Exception as e:
            print(f"Error saving to DynamoDB: {e}")
            return False

    def get_user_history(self, user_id: str):
        try:
            response = self.table.query(
                KeyConditionExpression="PK = :pk",
                ExpressionAttributeValues={
                    ":pk": f"USER#{user_id}"
                }
            )
            return response.get('Items', [])
        except Exception as e:
            print(f"Error querying DynamoDB: {e}")
            return []

import os
import boto3
import json
from botocore.exceptions import ClientError

def get_secret():
    secret_name = os.environ.get("AWS_SECRET_NAME", "CloudyAI/Settings")
    region_name = os.environ.get("AWS_REGION", "us-east-1")

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        # For a list of exceptions thrown, see
        # https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        print(f"Error retrieving secret: {e}")
        return {}
    else:
        # Decrypts secret using the associated KMS key.
        if 'SecretString' in get_secret_value_response:
            return json.loads(get_secret_value_response['SecretString'])
        else:
            return {}

# Load settings
# In a real app, you might merge these with local environment variables
settings = get_secret()

# Propagate settings to environment if not already set (so openai/gemini can read it)
if "OPENAI_API_KEY" in settings and not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = settings["OPENAI_API_KEY"]
if "GEMINI_API_KEY" in settings and not os.environ.get("GEMINI_API_KEY"):
    os.environ["GEMINI_API_KEY"] = settings["GEMINI_API_KEY"]


# Fallbacks for local development
settings.setdefault("COGNITO_USER_POOL_ID", os.environ.get("COGNITO_USER_POOL_ID", "us-east-1_xxxxxxxxx"))
settings.setdefault("COGNITO_CLIENT_ID", os.environ.get("COGNITO_CLIENT_ID", "xxxxxxxxxxxxxxxxxxxxxxxxxx"))
settings.setdefault("DYNAMODB_TABLE", os.environ.get("DYNAMODB_TABLE", "CloudyAI-History"))
settings.setdefault("S3_BUCKET", os.environ.get("S3_BUCKET", "cloudyai-assets"))


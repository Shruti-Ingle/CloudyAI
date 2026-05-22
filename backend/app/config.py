import os
import json

def get_secret():
    """Fetch secrets from AWS Secrets Manager. Returns empty dict gracefully when running locally."""
    secret_name = os.environ.get("AWS_SECRET_NAME", "CloudyAI/Settings")
    region_name = os.environ.get("AWS_REGION", "us-east-1")

    # Skip AWS call entirely in local dev when no credentials or secret name configured
    is_local = os.environ.get("LOCAL_DEV", "false").lower() == "true"
    if is_local:
        return {}

    try:
        import boto3
        from botocore.exceptions import ClientError, NoCredentialsError, NoRegionError

        session = boto3.session.Session()
        client = session.client(service_name='secretsmanager', region_name=region_name)

        get_secret_value_response = client.get_secret_value(SecretId=secret_name)

        if 'SecretString' in get_secret_value_response:
            return json.loads(get_secret_value_response['SecretString'])
        return {}

    except ImportError:
        # boto3 not installed - running in lightweight local mode
        return {}
    except Exception as e:
        # Silently ignore in local dev (no AWS credentials, secret not found, etc.)
        # Only log if we're actually in a cloud environment
        if os.environ.get("AWS_EXECUTION_ENV") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            print(f"[config] Warning: Could not retrieve secret '{secret_name}': {e}")
        return {}


# Load settings from AWS Secrets Manager (or empty dict locally)
settings = get_secret()

# Propagate secrets to environment variables if not already set
if "OPENAI_API_KEY" in settings and not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = settings["OPENAI_API_KEY"]
if "GEMINI_API_KEY" in settings and not os.environ.get("GEMINI_API_KEY"):
    os.environ["GEMINI_API_KEY"] = settings["GEMINI_API_KEY"]
if "OPENROUTER_API_KEY" in settings and not os.environ.get("OPENROUTER_API_KEY"):
    os.environ["OPENROUTER_API_KEY"] = settings["OPENROUTER_API_KEY"]
if "SILICONFLOW_API_KEY" in settings and not os.environ.get("SILICONFLOW_API_KEY"):
    os.environ["SILICONFLOW_API_KEY"] = settings["SILICONFLOW_API_KEY"]

# Fallbacks for local development
settings.setdefault("COGNITO_USER_POOL_ID", os.environ.get("COGNITO_USER_POOL_ID", "us-east-1_xxxxxxxxx"))
settings.setdefault("COGNITO_CLIENT_ID", os.environ.get("COGNITO_CLIENT_ID", "xxxxxxxxxxxxxxxxxxxxxxxxxx"))
settings.setdefault("DYNAMODB_TABLE", os.environ.get("DYNAMODB_TABLE", "CloudyAI-History"))
settings.setdefault("S3_BUCKET", os.environ.get("S3_BUCKET", "cloudyai-assets"))

import boto3
import json

regions = ['eu-west-2', 'us-east-1', 'us-west-2']
for region in regions:
    print(f"Trying region: {region}...")
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region
    )
    try:
        response = client.get_secret_value(SecretId="CloudyAI/Settings")
        if 'SecretString' in response:
            secret = json.loads(response['SecretString'])
            print(f"Success in {region}! Keys present:")
            for k, v in secret.items():
                print(f"- {k}: {v[:8]}...{v[-8:] if len(v) > 8 else ''} (length {len(v)})")
            break
    except Exception as e:
        print(f"Failed in {region}: {e}")

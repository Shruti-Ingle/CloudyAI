import * as dotenv from 'dotenv';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Load local .env file if present
dotenv.config();

interface AppSettings {
  GROQ_API_KEY?: string;
  GORQ_API_KEY?: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  DYNAMODB_TABLE: string;
  S3_BUCKET: string;
  AWS_REGION: string;
  LOCAL_DEV: boolean;
  [key: string]: any;
}

const localDev = process.env.LOCAL_DEV?.toLowerCase() === 'true' || !process.env.AWS_EXECUTION_ENV;

const defaultSettings: AppSettings = {
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || 'us-east-1_xxxxxxxxx',
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
  DYNAMODB_TABLE: process.env.DYNAMODB_TABLE || 'CloudyAI-History',
  S3_BUCKET: process.env.S3_BUCKET || 'cloudyai-assets',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  LOCAL_DEV: localDev
};

let settings: AppSettings = { ...defaultSettings };

async function fetchAwsSecrets(): Promise<Partial<AppSettings>> {
  if (localDev) {
    return {};
  }

  const secretName = process.env.AWS_SECRET_NAME || 'CloudyAI/Settings';
  const region = process.env.AWS_REGION || 'us-east-1';

  try {
    const client = new SecretsManagerClient({ region });
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
  } catch (error: any) {
    // Only log if we are actually expected to be in a cloud environment
    if (process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.warn(`[config] Warning: Could not retrieve secret '${secretName}':`, error.message || error);
    }
  }
  return {};
}

// Global initialization function to load AWS secrets
export async function initializeConfig(): Promise<AppSettings> {
  const awsSecrets = await fetchAwsSecrets();
  
  settings = {
    ...settings,
    ...awsSecrets
  };

  // Propagate to environment variables if not already set
  const keysToPropagate = [
    'GROQ_API_KEY',
    'GORQ_API_KEY'
  ];

  for (const key of keysToPropagate) {
    if (settings[key] && !process.env[key]) {
      process.env[key] = settings[key];
    }
  }

  return settings;
}

export function getSettings(): AppSettings {
  return settings;
}

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.bucket = process.env.S3_BUCKET || 'cloudyai-assets';
  }

  public async uploadFile(fileContent: Buffer, objectName: string): Promise<boolean> {
    try {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectName,
        Body: fileContent
      }));
      return true;
    } catch (e) {
      console.error(`Error uploading to S3: ${e}`);
      return false;
    }
  }

  public async getDownloadUrl(objectName: string, expiresIn = 3600): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectName
      });
      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (e) {
      console.error(`Error generating presigned URL: ${e}`);
      return null;
    }
  }
}

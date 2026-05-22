import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';

export class TextractService {
  private client: TextractClient;

  constructor() {
    this.client = new TextractClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  public async extractTextFromS3(bucket: string, documentName: string): Promise<string | null> {
    try {
      const command = new DetectDocumentTextCommand({
        Document: {
          S3Object: {
            Bucket: bucket,
            Name: documentName
          }
        }
      });

      const response = await this.client.send(command);
      let detectedText = '';

      if (response.Blocks) {
        for (const item of response.Blocks) {
          if (item.BlockType === 'LINE' && item.Text) {
            detectedText += item.Text + '\n';
          }
        }
      }

      return detectedText;
    } catch (e) {
      console.error(`Error invoking Textract: ${e}`);
      return null;
    }
  }
}

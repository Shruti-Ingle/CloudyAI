import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

export class DynamoService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.DYNAMODB_TABLE || 'CloudyAI-History';
  }

  public async saveGeneration(userId: string, title: string, platform: string, data: any): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${userId}`,
          SK: `GEN#${now}`,
          title: title,
          platform: platform,
          data: data,
          created_at: now
        }
      }));
      return true;
    } catch (e) {
      console.error(`Error saving to DynamoDB: ${e}`);
      return false;
    }
  }

  public async getUserHistory(userId: string): Promise<any[]> {
    try {
      const response = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`
        }
      }));
      return response.Items || [];
    } catch (e) {
      console.error(`Error querying DynamoDB: ${e}`);
      return [];
    }
  }
}

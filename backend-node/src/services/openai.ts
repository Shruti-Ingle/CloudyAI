import OpenAI from 'openai';
import { getSystemPrompt } from '../utils/promptBuilder.js';
import { ChatMessage } from './gemini.js';

export class OpenAIService {
  public client: OpenAI | null = null;
  public apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || null;
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  public async generateArchitecture(prompt: string, platform: string = 'AWS', history: ChatMessage[] | null = null): Promise<any> {
    if (!this.client) {
      return { error: 'OpenAI API Key is not set. Please set the OPENAI_API_KEY environment variable.' };
    }

    let contextStr = '';
    if (history && history.length > 0) {
      contextStr = 'Conversation Context:\n';
      for (const msg of history) {
        const role = msg.isBot ? 'Assistant (Cloudy AI)' : 'User';
        contextStr += `- ${role}: ${msg.text}\n`;
      }
      contextStr += '\nNew requirement based on history:\n';
    }

    const fullUserPrompt = `${contextStr}Design a highly available and cost-optimized ${platform} architecture for: ${prompt}`;
    const systemPrompt = getSystemPrompt(platform);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullUserPrompt }
        ],
        response_format: { type: 'json_object' }
      });

      const textResponse = response.choices[0].message.content;
      return JSON.parse(textResponse ? textResponse.trim() : '{}');
    } catch (error: any) {
      console.error(`Error invoking OpenAI: ${error}`);
      return { error: error.message || error };
    }
  }

  public async analyseArchitecture(architectureData: string): Promise<any> {
    if (!this.client) {
      return { error: 'OpenAI API Key is not set. Please set the OPENAI_API_KEY environment variable.' };
    }

    const systemPrompt = `You are an expert cloud architect. Analyze the provided architecture and return a JSON object with 'issues' (a list of objects with 'severity', 'title', 'description', and 'suggestion') and 'suggested_nodes' and 'suggested_edges' arrays for React Flow representing the improved architecture. Do not include any explanations, markdown code blocks, or text outside the JSON.

Example structure:
{
  "issues": [
    {
      "severity": "high",
      "title": "Single Point of Failure",
      "description": "The database is deployed in a single availability zone without replication.",
      "suggestion": "Enable multi-AZ deployment for high availability."
    }
  ],
  "suggested_nodes": [],
  "suggested_edges": []
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this architecture and suggest improvements: ${architectureData}` }
        ],
        response_format: { type: 'json_object' }
      });

      const textResponse = response.choices[0].message.content;
      return JSON.parse(textResponse ? textResponse.trim() : '{}');
    } catch (error: any) {
      console.error(`Error invoking OpenAI: ${error}`);
      return { error: error.message || error };
    }
  }
}

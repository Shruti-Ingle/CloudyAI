import axios from 'axios';
import { getSystemPrompt } from '../utils/promptBuilder.js';
import { ChatMessage } from './gemini.js';

export class OllamaService {
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
    this.defaultModel = process.env.OLLAMA_MODEL || 'gemma3';
  }

  private async _getActiveModel(): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
      const models = response.data.models || [];
      if (models.length > 0) {
        return models[0].name;
      }
    } catch (error: any) {
      console.warn(`OllamaService failed to fetch active models from /api/tags: ${error.message || error}`);
    }
    return this.defaultModel;
  }

  private async _callOllama(messages: any[], systemPrompt: string | null = null, requireJson: boolean = false): Promise<string> {
    const activeModel = await this._getActiveModel();
    const payloadMessages: any[] = [];
    
    if (systemPrompt) {
      payloadMessages.push({ role: 'system', content: systemPrompt });
    }
    payloadMessages.push(...messages);

    const payload: any = {
      model: activeModel,
      messages: payloadMessages,
      stream: false,
      options: {
        temperature: 0.2
      }
    };

    if (requireJson) {
      payload.format = 'json';
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api/chat`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      });

      let content = response.data.message.content.trim();
      // Strip out any <think>...</think> reasoning blocks if using DeepSeek-R1
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      return content;
    } catch (error: any) {
      console.error(`Ollama chat call failed on ${activeModel}: ${error.message || error}`);
      throw error;
    }
  }

  public async generateArchitecture(prompt: string, platform: string = 'AWS', history: ChatMessage[] | null = null): Promise<any> {
    let contextStr = '';
    if (history) {
      contextStr = 'Conversation Context:\n';
      for (const msg of history) {
        const role = msg.isBot ? 'Assistant (Cloudy AI)' : 'User';
        contextStr += `- ${role}: ${msg.text}\n`;
      }
      contextStr += '\nNew requirement based on history:\n';
    }

    const fullPrompt = `${contextStr}Design a highly available and cost-optimized ${platform} architecture for: ${prompt}`;
    const systemPrompt = getSystemPrompt(platform);

    try {
      let resText = await this._callOllama(
        [{ role: 'user', content: fullPrompt }],
        systemPrompt,
        true
      );

      resText = resText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      return JSON.parse(resText.trim());
    } catch (error: any) {
      console.error(`Ollama generate architecture failed: ${error}`);
      return { error: error.message || error };
    }
  }

  public async generateChatResponse(userMessage: string, history: ChatMessage[], platform: string = 'AWS', questionIndex: number | null = null): Promise<any> {
    const QUESTIONS: Record<string, string[]> = {
      AWS: [
        "What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)",
        "How would you like to host and deliver your frontend client? (e.g. static S3 + CloudFront CDN for super-fast global delivery, or server-side rendered on AWS Amplify/App Runner?)",
        "What compute tier fits your backend business logic best? (e.g. Serverless AWS Lambda for zero-idle scaling, containerized Amazon ECS/EKS for constant loads, or EC2 VMs?)",
        "What kind of database fits your data model? (e.g. Relational Postgres/MySQL via Amazon RDS/Aurora, or high-throughput NoSQL via DynamoDB?)",
        "How will clients communicate with your backend? (e.g. REST API via Amazon API Gateway, or GraphQL via AWS AppSync?)",
        "How would you like to handle user registration, logins, and JWT token validation? (e.g. Serverless AWS Cognito user pools, or custom OAuth/Auth0?)",
        "Does your application require persistent object storage for files, media, or backups? (e.g. Amazon S3 buckets, or shared Elastic File System?)",
        "Do you need a low-latency caching layer to speed up database read operations? (e.g. ElastiCache Redis/Memcached, or standard DB read replicas?)",
        "What level of network security do you require? (e.g. placing resources in private subnets, enabling AWS WAF firewall, or KMS key encryption?)",
        "How do you plan to manage deployment and Infrastructure as Code? (e.g. Terraform, AWS CloudFormation/CDK, or standard GitHub Actions pipelines?)"
      ],
      GCP: [
        "What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)",
        "How would you like to host and deliver your frontend client? (e.g. Firebase Hosting + Cloud CDN, or server-side rendered on Cloud Run?)",
        "What compute tier fits your backend business logic best? (e.g. Serverless Cloud Run / Cloud Functions, containerized Google Kubernetes Engine (GKE), or Compute Engine VMs?)",
        "What kind of database fits your data model? (e.g. Relational Postgres/MySQL via Cloud SQL/Spanner, or high-throughput NoSQL via Firestore/Bigtable?)",
        "How will clients communicate with your backend? (e.g. Google Cloud API Gateway, or direct Cloud Run URLs?)",
        "How would you like to handle user registration, logins, and JWT token validation? (e.g. Google Identity Platform / Firebase Auth, or custom OAuth?)",
        "Does your application require persistent object storage for files, media, or backups? (e.g. Cloud Storage buckets?)",
        "Do you need a low-latency caching layer to speed up database read operations? (e.g. Memorystore Redis/Memcached?)",
        "What level of network security do you require? (e.g. Cloud Armor WAF firewall, VPC Service Controls, or Cloud KMS encryption?)",
        "How do you plan to manage deployment and Infrastructure as Code? (e.g. Terraform, Cloud Build, or standard GitHub Actions?)"
      ],
      Azure: [
        "What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)",
        "How would you like to host and deliver your frontend client? (e.g. Azure Static Web Apps + Front Door CDN, or App Service?)",
        "What compute tier fits your backend business logic best? (e.g. Serverless Azure Functions, containerized Azure Container Apps / Azure Kubernetes Service (AKS), or App Service?)",
        "What kind of database fits your data model? (e.g. Relational Azure SQL / Database for PostgreSQL, or high-throughput NoSQL via Cosmos DB?)",
        "How will clients communicate with your backend? (e.g. Azure API Management (APIM), or Application Gateway?)",
        "How would you like to handle user registration, logins, and JWT token validation? (e.g. Microsoft Entra ID / B2C, or custom OAuth?)",
        "Does your application require persistent object storage for files, media, or backups? (e.g. Azure Blob Storage?)",
        "Do you need a low-latency caching layer to speed up database read operations? (e.g. Azure Cache for Redis?)",
        "What level of network security do you require? (e.g. Azure WAF firewall, Key Vault, or private endpoints?)",
        "How do you plan to manage deployment and Infrastructure as Code? (e.g. Terraform, Azure Bicep/ARM, or Azure Pipelines/GitHub Actions?)"
      ]
    };

    const questionsList = QUESTIONS[platform] || QUESTIONS['AWS'];
    let numUserMessages = 0;

    if (questionIndex !== null) {
      numUserMessages = questionIndex;
    } else {
      numUserMessages = history ? history.filter(msg => !msg.isBot).length : 0;
    }

    let historyStr = '';
    if (history) {
      for (const msg of history) {
        const role = msg.isBot ? 'Cloudy AI' : 'User';
        historyStr += `${role}: ${msg.text}\n`;
      }
    }

    let systemPrompt = '';
    let prompt = '';

    if (numUserMessages < questionsList.length) {
      const currentQuestion = questionsList[numUserMessages];
      systemPrompt = `You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect assistant specialized in ${platform}.
The user is designing a cloud application. Your role is to have a natural, professional conversation to understand their needs and help them refine their architecture.

Rules:
1. Be friendly, conversational, and highly technical.
2. Keep your response brief and to the point (maximum 2 sentences).
3. Intelligently acknowledge the user's latest choice/message with expert technical insight.
4. At the end of your response, ask this EXACT question: '${currentQuestion}'
5. Do NOT ask any other questions. Do NOT output any JSON, YAML, code blocks, or diagram structures.`;
      
      prompt = `Conversation history:\n${historyStr}User: ${userMessage}\n\nInstruction: Acknowledge user's input with brief tech insights, and then ask Question #${numUserMessages + 1}: '${currentQuestion}'\n\nGenerate your technical response:`;
    } else {
      systemPrompt = `You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect assistant specialized in ${platform}.
The user is designing a cloud application.

Rules:
1. Be friendly, conversational, and highly technical.
2. Keep your response brief and to the point (maximum 2 sentences).
3. Let the user know that you have gathered all standard architectural inputs. Suggest that they can mention any additional requirements, or click the 'Generate Architecture' button below to create their design.
4. Do NOT ask any new questions. Do NOT output any JSON, YAML, code blocks, or diagram structures.`;
      
      prompt = `Conversation history:\n${historyStr}User: ${userMessage}\n\nInstruction: Acknowledge user's input, let them know onboarding is complete, and suggest they click 'Generate Architecture' or mention additional requests.\n\nGenerate your technical response:`;
    }

    try {
      const resText = await this._callOllama(
        [{ role: 'user', content: prompt }],
        systemPrompt
      );
      return { reply: resText };
    } catch (error) {
      console.error(`Ollama chat failed: ${error}`);
      return { reply: 'I encountered a minor connection issue. Tell me more about your requirements or click Generate Architecture whenever you are ready!' };
    }
  }

  public async analyseArchitecture(architectureData: string): Promise<any> {
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

    const prompt = `Analyze this architecture and suggest improvements: ${architectureData}`;

    try {
      let resText = await this._callOllama(
        [{ role: 'user', content: prompt }],
        systemPrompt,
        true
      );
      resText = resText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      return JSON.parse(resText.trim());
    } catch (error: any) {
      console.error(`Ollama analysis failed: ${error}`);
      return { error: error.message || error };
    }
  }
}

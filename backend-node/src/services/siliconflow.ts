import axios from 'axios';
import { getSystemPrompt } from '../utils/promptBuilder.js';
import { ChatMessage } from './gemini.js';

export class SiliconFlowService {
  private apiKey: string;
  private baseUrl = 'https://api.siliconflow.cn/v1/chat/completions';
  
  // SiliconFlow hosts deepseek-ai/DeepSeek-V3 and Qwen2.5-72B-Instruct!
  private primaryModel = 'deepseek-ai/DeepSeek-V3';
  private fallbackModel = 'Qwen/Qwen2.5-72B-Instruct';

  constructor() {
    this.apiKey = process.env.SILICONFLOW_API_KEY || '';
  }

  private async _callSiliconFlow(messages: any[], systemPrompt?: string, requireJson = false): Promise<string> {
    const payloadMessages = [];
    if (systemPrompt) {
      payloadMessages.push({ role: 'system', content: systemPrompt });
    }
    payloadMessages.push(...messages);

    const payload: any = {
      model: this.primaryModel,
      messages: payloadMessages,
      temperature: 0.2,
      max_tokens: 2048
    };

    if (requireJson) {
      payload.response_format = { type: 'json_object' };
    }

    const models = [this.primaryModel, this.fallbackModel];
    let lastError: any = null;

    for (const model of models) {
      payload.model = model;
      try {
        const response = await axios.post(this.baseUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 15000
        });

        const content = response.data?.choices?.[0]?.message?.content;
        if (content) {
          return content.trim();
        }
      } catch (error: any) {
        const errData = error.response ? JSON.stringify(error.response.data) : error.message;
        console.warn(`SiliconFlow model ${model} failed with: ${errData}`);
        lastError = error;
      }
    }

    throw new Error(`Failed to get response from all configured SiliconFlow models. Last error: ${lastError?.message || lastError}`);
  }

  public async generateArchitecture(prompt: string, platform = 'AWS', history: ChatMessage[] | null = null): Promise<any> {
    let contextStr = '';
    if (history && history.length > 0) {
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
      const resText = await this._callSiliconFlow(
        [{ role: 'user', content: fullPrompt }],
        systemPrompt,
        true
      );
      return JSON.parse(resText);
    } catch (e: any) {
      console.error(`SiliconFlow generate architecture failed: ${e}`);
      return { error: e.message || e };
    }
  }

  public async generateChatResponse(userMessage: string, history: ChatMessage[], platform = 'AWS', questionIndex: number | null = null): Promise<any> {
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
      const resText = await this._callSiliconFlow(
        [{ role: 'user', content: prompt }],
        systemPrompt
      );
      return { reply: resText };
    } catch (e: any) {
      console.error(`SiliconFlow chat failed: ${e}`);
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
      const resText = await this._callSiliconFlow(
        [{ role: 'user', content: prompt }],
        systemPrompt,
        true
      );
      return JSON.parse(resText);
    } catch (e: any) {
      console.error(`SiliconFlow analysis failed: ${e}`);
      return { error: e.message || e };
    }
  }
}

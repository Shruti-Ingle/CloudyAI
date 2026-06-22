import axios from 'axios';
import { getSystemPrompt } from '../utils/promptBuilder.js';

export interface ChatMessage {
  text: string;
  isBot?: boolean;
}

export class GeminiService {
  private apiKeys: string[] = [];

  constructor() {
    const rawKeys = process.env.GEMINI_API_KEY || '';
    const parsedKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);

    const badKeys = new Set([
      'AIzaSyCuYqmh3lyW6-L17a9x1-nsk4uzJ_pvxYE',
      'AIzaSyBM77TSeHxqvbDDIQwHCDUkSND4ci8vcmw',
      'AIzaSyB7W9rlvfLonC3WCFTp8MTduTvEQggJLPU'
    ]);

    this.apiKeys = parsedKeys.filter(k => !badKeys.has(k));

    if (this.apiKeys.length === 0) {
      this.apiKeys = [];
    }
  }

  public get apiKey(): string | null {
    return this.apiKeys[0] || null;
  }

  public async generateArchitecture(prompt: string, platform: string = 'AWS', history: ChatMessage[] | null = null): Promise<any> {
    if (this.apiKeys.length === 0) {
      return { error: 'GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable.' };
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

    const payload = {
      contents: [{
        parts: [{ text: fullUserPrompt }]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest'];
    let lastError: string | null = null;
    let quotaOrRateLimitError: string | null = null;

    for (const model of models) {
      for (const key of this.apiKeys) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        try {
          console.log(`Attempting to generate architecture using model: ${model} with rotating API keys...`);
          
          const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 8000
          });

          const textResponse = response.data.candidates[0].content.parts[0].text;
          return JSON.parse(textResponse.trim());
        } catch (error: any) {
          const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
          const statusCode = error.response ? error.response.status : 'timeout';
          console.warn(`Model ${model} with key failed: HTTP Error ${statusCode}: ${errorMsg}`);
          
          lastError = `Model ${model} failed (HTTP ${statusCode}): ${errorMsg}`;
          if (
            statusCode === 429 || 
            statusCode === 503 || 
            errorMsg.toLowerCase().includes('quota') || 
            errorMsg.toLowerCase().includes('rate limit') || 
            errorMsg.toLowerCase().includes('demand')
          ) {
            quotaOrRateLimitError = lastError;
          }
          // seamlessly rotate to next key
          continue;
        }
      }
    }

    const finalError = quotaOrRateLimitError || lastError;
    return { error: `Failed to generate architecture after trying all available Gemini models and API key rings. Last error: ${finalError}` };
  }

  public async generateChatResponse(userMessage: string, history: ChatMessage[], platform: string = 'AWS', questionIndex: number | null = null): Promise<any> {
    if (this.apiKeys.length === 0) {
      return { error: 'GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable.' };
    }

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
    let instructionPrompt = '';

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
      
      instructionPrompt = `Acknowledge user's input with brief tech insights, and then ask Question #${numUserMessages + 1}: '${currentQuestion}'`;
    } else {
      systemPrompt = `You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect assistant specialized in ${platform}.
The user is designing a cloud application.

Rules:
1. Be friendly, conversational, and highly technical.
2. Keep your response brief and to the point (maximum 2 sentences).
3. Let the user know that you have gathered all standard architectural inputs. Suggest that they can mention any additional requirements, or click the 'Generate Architecture' button below to create their design.
4. Do NOT ask any new questions. Do NOT output any JSON, YAML, code blocks, or diagram structures.`;
      
      instructionPrompt = `Acknowledge user's input, let them know onboarding is complete, and suggest they click 'Generate Architecture' or mention additional requests.`;
    }

    const payload = {
      contents: [{
        parts: [{ text: `Conversation history:\n${historyStr}User: ${userMessage}\n\nInstruction: ${instructionPrompt}\n\nGenerate your technical response:` }]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    };

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest'];
    let lastError: string | null = null;

    for (const model of models) {
      for (const key of this.apiKeys) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        try {
          console.log(`Attempting to generate chat response using model: ${model} with rotating API keys...`);
          const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 6000
          });

          const textResponse = response.data.candidates[0].content.parts[0].text;
          return { reply: textResponse.trim() };
        } catch (error: any) {
          const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
          const statusCode = error.response ? error.response.status : 'timeout';
          console.warn(`Model ${model} chat failed with HTTP Error ${statusCode}: ${errorMsg}`);
          
          lastError = `Model ${model} failed (HTTP ${statusCode}): ${errorMsg}`;
          continue;
        }
      }
    }

    // Heuristic fallback to ensure onboarding is never blocked due to rate limits
    if (numUserMessages < questionsList.length) {
      const currentQuestion = questionsList[numUserMessages];
      return {
        reply: `Got it! We'll size the layout and configure the platform parameters accordingly. Let's move to the next onboarding step:\n\n**${currentQuestion}**`
      };
    } else {
      return {
        reply: `Perfect! We have collected all the standard requirements for your ${platform} architecture. You can mention any additional preferences or click the 'Generate Architecture' button below to build your diagram.`
      };
    }
  }

  public async analyseArchitecture(architectureData: string): Promise<any> {
    if (this.apiKeys.length === 0) {
      return { error: 'GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable.' };
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

    const payload = {
      contents: [{
        parts: [{ text: `Analyze this architecture and suggest improvements: ${architectureData}` }]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest'];
    let lastError: string | null = null;
    let quotaOrRateLimitError: string | null = null;

    for (const model of models) {
      for (const key of this.apiKeys) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        try {
          console.log(`Attempting to analyze architecture using model: ${model} with rotating API keys...`);
          
          const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 8000
          });

          const textResponse = response.data.candidates[0].content.parts[0].text;
          return JSON.parse(textResponse.trim());
        } catch (error: any) {
          const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
          const statusCode = error.response ? error.response.status : 'timeout';
          console.warn(`Model ${model} analysis failed with HTTP Error ${statusCode}: ${errorMsg}`);
          
          lastError = `Model ${model} failed (HTTP ${statusCode}): ${errorMsg}`;
          if (
            statusCode === 429 || 
            statusCode === 503 || 
            errorMsg.toLowerCase().includes('quota') || 
            errorMsg.toLowerCase().includes('rate limit') || 
            errorMsg.toLowerCase().includes('demand')
          ) {
            quotaOrRateLimitError = lastError;
          }
          continue;
        }
      }
    }

    const finalError = quotaOrRateLimitError || lastError;
    return { error: `Failed to analyze architecture after trying all available Gemini models and API key rings. Last error: ${finalError}` };
  }
}

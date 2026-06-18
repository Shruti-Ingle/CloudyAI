import { Router, Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { OllamaService } from '../services/ollama.js';
import { OpenRouterService } from '../services/openrouter.js';
import { SiliconFlowService } from '../services/siliconflow.js';
import { GeminiService } from '../services/gemini.js';
import { OpenAIService } from '../services/openai.js';
import { BedrockService } from '../services/bedrock.js';
import { S3Service } from '../services/s3.js';
import { DynamoService } from '../services/dynamo.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

const router = Router();

// Services instantiations
const ollamaService = new OllamaService();
const openrouterService = new OpenRouterService();
const siliconflowService = new SiliconFlowService();
const geminiService = new GeminiService();
const openaiService = new OpenAIService();
const bedrockService = new BedrockService();
const s3Service = new S3Service();
const dynamoService = new DynamoService();

router.post('/architecture', async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, platform = 'AWS', history = null } = req.body;
  if (!prompt) {
    return res.status(400).json({ detail: 'Prompt is required' });
  }

  const runGeneration = async () => {
    // 1. Try Ollama first!
    try {
      console.log('Attempting to generate architecture using Ollama...');
      const result = await ollamaService.generateArchitecture(prompt, platform, history);
      if (result && !result.error) {
        return {
          status: 'success',
          platform,
          nodes: result.nodes || [],
          edges: result.edges || [],
          cost: result.cost || {}
        };
      }
      console.warn(`Ollama generation returned error: ${result?.error}. Falling back to OpenRouter...`);
    } catch (e) {
      console.warn(`Ollama generation failed with exception: ${e}. Falling back to OpenRouter...`);
    }

    // 2. Try OpenRouter second
    try {
      console.log('Attempting to generate architecture using OpenRouter (DeepSeek V3)...');
      const result = await openrouterService.generateArchitecture(prompt, platform, history);
      if (result && !result.error) {
        return {
          status: 'success',
          platform,
          nodes: result.nodes || [],
          edges: result.edges || [],
          cost: result.cost || {}
        };
      }
      console.warn(`OpenRouter generation returned error: ${result?.error}. Falling back to SiliconFlow...`);
    } catch (e) {
      console.warn(`OpenRouter generation failed with exception: ${e}. Falling back to SiliconFlow...`);
    }

    // 3. Try SiliconFlow third
    try {
      console.log('Attempting to generate architecture using SiliconFlow...');
      const result = await siliconflowService.generateArchitecture(prompt, platform, history);
      if (result && !result.error) {
        return {
          status: 'success',
          platform,
          nodes: result.nodes || [],
          edges: result.edges || [],
          cost: result.cost || {}
        };
      }
      console.warn(`SiliconFlow generation returned error: ${result?.error}. Falling back to Gemini...`);
    } catch (e) {
      console.warn(`SiliconFlow generation failed with exception: ${e}. Falling back to Gemini...`);
    }

    // 4. Try Gemini (Google) as the final fallback
    let geminiResult: any = null;
    try {
      geminiResult = await geminiService.generateArchitecture(prompt, platform, history);
      if (geminiResult && !geminiResult.error) {
        return {
          status: 'success',
          platform,
          nodes: geminiResult.nodes || [],
          edges: geminiResult.edges || [],
          cost: geminiResult.cost || {}
        };
      }
    } catch (geminiErr) {
      console.warn(`Gemini generation failed with exception: ${geminiErr}. Trying OpenAI/Bedrock fallbacks...`);
      geminiResult = { error: `Gemini generation failed: ${geminiErr}` };
    }

    if (geminiResult && geminiResult.error) {
      const errorLower = String(geminiResult.error).toLowerCase();
      // Automatic OpenAI failover recovery fallback loop if Gemini key hits a rate limit block!
      if (errorLower.includes('rate limit') || errorLower.includes('quota') || errorLower.includes('demand')) {
        try {
          if (openaiService.client) {
            console.log('Gemini rate limited - attempting OpenAI Architecture generation fallback...');
            const openaiResult = await openaiService.generateArchitecture(prompt, platform, history);
            if (openaiResult && !openaiResult.error) {
              console.log('Successfully recovered from Gemini rate limit using OpenAI fallback!');
              return {
                status: 'success',
                platform,
                nodes: openaiResult.nodes || [],
                edges: openaiResult.edges || [],
                cost: openaiResult.cost || {}
              };
            }
          }
        } catch (oaiErr) {
          console.warn(`OpenAI fallback invocation failed: ${oaiErr}`);
        }
      }

      // Try AWS Bedrock as the ultimate bulletproof fallback!
      try {
        console.log('Gemini generation failed - attempting AWS Bedrock fallback...');
        const bedrockResult = await bedrockService.generateArchitecture(prompt, platform, history);
        if (bedrockResult && !bedrockResult.error && (bedrockResult.nodes || bedrockResult.edges)) {
          console.log('Successfully recovered from generation failure using AWS Bedrock fallback!');
          return {
            status: 'success',
            platform,
            nodes: bedrockResult.nodes || [],
            edges: bedrockResult.edges || [],
            cost: bedrockResult.cost || {}
          };
        }
      } catch (bedrockErr) {
        console.warn(`AWS Bedrock fallback generation failed: ${bedrockErr}`);
      }

      let errMsg = geminiResult.error || 'Unknown generation error';
      const errMsgLower = String(errMsg).toLowerCase();
      if (errMsgLower.includes('rate limit') || errMsgLower.includes('quota') || errMsgLower.includes('demand')) {
        errMsg = (
          'Failed to generate architecture. Connection to your local Ollama service at http://localhost:11434 failed, ' +
          'and all cloud fallback services (Google Gemini, OpenAI, Bedrock) are currently rate-limited or unavailable. ' +
          'Please make sure your local Ollama is active (`ollama run gemma3`) and listening on port 11434.'
        );
      }

      return {
        status: 'error',
        message: errMsg
      };
    }

    return {
      status: 'success',
      platform,
      nodes: geminiResult?.nodes || [],
      edges: geminiResult?.edges || [],
      cost: geminiResult?.cost || {}
    };
  };

  const resultPayload = await runGeneration();

  if (resultPayload.status === 'success') {
    // AWS background saves
    try {
      const userId = req.user?.sub || 'anonymous';
      const generationId = crypto.randomUUID();
      const s3Key = `generations/${userId}/${generationId}.json`;
      const jsonBytes = Buffer.from(JSON.stringify(resultPayload, null, 2), 'utf-8');

      // 1. Save JSON to S3
      const s3Success = await s3Service.uploadFile(jsonBytes, s3Key);
      if (s3Success) {
        console.log(`Successfully uploaded architecture to S3: ${s3Key}`);
      } else {
        console.warn('Warning: S3 upload failed, proceeding anyway');
      }

      // 2. Save metadata + S3 key in DynamoDB
      const dbData = {
        generation_id: generationId,
        nodes: resultPayload.nodes || [],
        edges: resultPayload.edges || [],
        cost: resultPayload.cost || {},
        s3_key: s3Key
      };

      const dynamoSuccess = await dynamoService.saveGeneration(
        userId,
        prompt,
        platform,
        dbData
      );
      if (dynamoSuccess) {
        console.log(`Successfully logged generation in DynamoDB for user ${userId}`);
      } else {
        console.warn('Warning: DynamoDB log failed');
      }
    } catch (awsErr) {
      console.warn(`Failed to perform AWS background saves: ${awsErr}`);
    }
  }

  return res.json(resultPayload);
});

router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  const { message, history = null, platform = 'AWS', question_index = null } = req.body;
  if (!message) {
    return res.status(400).json({ detail: 'Message is required' });
  }

  // 1. Try Ollama first!
  try {
    console.log('Attempting chat completion using Ollama...');
    const result = await ollamaService.generateChatResponse(message, history, platform, question_index);
    if (result && result.reply && !result.reply.toLowerCase().includes('connection issue') && !result.reply.toLowerCase().includes('rate limits')) {
      return res.json({
        status: 'success',
        reply: result.reply
      });
    }
    console.warn('Ollama chat returned connection/error reply. Falling back to OpenRouter...');
  } catch (e) {
    console.warn(`Ollama chat failed with exception: ${e}. Falling back to OpenRouter...`);
  }

  // 2. Try OpenRouter second
  try {
    console.log('Attempting chat completion using OpenRouter...');
    const result = await openrouterService.generateChatResponse(message, history, platform, question_index);
    if (result && result.reply && !result.reply.toLowerCase().includes('connection issue')) {
      return res.json({
        status: 'success',
        reply: result.reply
      });
    }
    console.warn('OpenRouter chat returned connection error. Falling back to SiliconFlow...');
  } catch (e) {
    console.warn(`OpenRouter chat failed with exception: ${e}. Falling back to SiliconFlow...`);
  }

  // 3. Try SiliconFlow third
  try {
    console.log('Attempting chat completion using SiliconFlow...');
    const result = await siliconflowService.generateChatResponse(message, history, platform, question_index);
    if (result && result.reply && !result.reply.toLowerCase().includes('connection issue')) {
      return res.json({
        status: 'success',
        reply: result.reply
      });
    }
    console.warn('SiliconFlow chat returned connection error. Falling back to Gemini...');
  } catch (e) {
    console.warn(`SiliconFlow chat failed with exception: ${e}. Falling back to Gemini...`);
  }

  // 4. Try Gemini (Google) as final fallback
  let replyText = '';
  try {
    const result = await geminiService.generateChatResponse(message, history, platform, question_index);
    replyText = result.reply || '';
  } catch (geminiErr) {
    console.warn(`Gemini chat failed with exception: ${geminiErr}. Falling back to OpenAI or heuristic.`);
  }

  const replyTextLower = replyText.toLowerCase();
  const hasRateLimit = !replyText || replyTextLower.includes('quota') || replyTextLower.includes('rate limit') || replyTextLower.includes('high demand') || replyTextLower.includes('connection issue') || replyTextLower.includes('temporary');

  if (hasRateLimit) {
    // Automatic OpenAI failover recovery fallback loop if Gemini key hits a rate limit block!
    try {
      if (openaiService.client) {
        console.log('Gemini rate limited - attempting OpenAI Chat completion fallback...');
        const response = await openaiService.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect specialized in ${platform}. Ask ONE clarifying question. Keep response to 2-3 sentences.` },
            { role: 'user', content: message }
          ]
        });
        const openaiReply = response.choices[0].message.content;
        console.log('Successfully recovered from Gemini rate limit in chat using OpenAI fallback!');
        return res.json({
          status: 'success',
          reply: openaiReply ? openaiReply.trim() : 'How else can I assist you with your architecture?'
        });
      }
    } catch (oaiErr) {
      console.warn(`OpenAI chat fallback failed: ${oaiErr}`);
    }

    // Heuristic fallback if both Gemini and OpenAI fail or are offline
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
        "What compute tier fits your backend business logic best? (e.g. Serverless Azure ... containerized Azure Container Apps / Azure Kubernetes Service (AKS), or App Service?)",
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
    const numUserMessages = question_index !== null ? question_index : (history ? history.filter((msg: any) => !msg.isBot).length : 0);
    
    if (numUserMessages < questionsList.length) {
      replyText = `Got it! We'll size the layout and configure the platform parameters accordingly. Let's move to the next onboarding step:\n\n**${questionsList[numUserMessages]}**`;
    } else {
      replyText = `Perfect! We have collected all the standard requirements for your ${platform} architecture. You can mention any additional preferences or click the 'Generate Architecture' button below to build your diagram.`;
    }
  }

  return res.json({
    status: 'success',
    reply: replyText
  });
});

router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.sub || 'anonymous';
    const dbItems = await dynamoService.getUserHistory(userId);

    const historyList = dbItems.map((item: any) => {
      const data = item.data || {};
      const nodes = data.nodes || [];
      const cost = data.cost || {};

      const isAnalysed = data.analysis || data.file_id || item.title?.startsWith('Analysed') || item.title?.startsWith('Custom Architecture Analysis');

      return {
        id: data.generation_id || data.file_id || item.SK || '',
        type: isAnalysed ? 'analysed' : 'generated',
        title: item.title || 'Untitled Architecture',
        platform: item.platform || 'AWS',
        services: nodes.length || (data.beforeNodes?.length || 0),
        cost: cost.total_monthly_cost || '$0.00',
        nodes: nodes,
        edges: data.edges || [],
        cost_details: cost,
        date: item.created_at || '',
        issues: data.analysis?.issues?.length || data.issues?.length || 0,
        issues_list: data.analysis?.issues || data.issues || [],
        beforeNodes: data.beforeNodes || null,
        beforeEdges: data.beforeEdges || null,
        rawAnalysis: data.analysis || data.rawAnalysis || null,
        rawArchitecture: data.rawArchitecture || null
      };
    });

    return res.json(historyList);
  } catch (e) {
    console.error(`Error fetching history from DynamoDB: ${e}`);
    return res.status(500).json({ detail: 'Failed to fetch history from database' });
  }
});

// Active training processes tracking state in memory as fallback
let currentTrainingStatus = {
  status: 'idle',
  progress: 0,
  logs: '',
  error: null as string | null
};

router.post('/train-architecture', async (req: AuthenticatedRequest, res: Response) => {
  const { baseModel = 'gemma3', epochs = 5, samples = 50, ollamaUrl = 'http://localhost:11434' } = req.body;

  if (currentTrainingStatus.status === 'running') {
    return res.status(400).json({ detail: 'A model training session is already in progress' });
  }

  // Set paths for logs and status
  const trainingDir = path.join(projectRoot, 'ml_models/architecture_generation');
  if (!fs.existsSync(trainingDir)) {
    fs.mkdirSync(trainingDir, { recursive: true });
  }
  const logPath = path.join(trainingDir, 'training.log');
  const statusPath = path.join(trainingDir, 'training_status.json');

  // Initialize status & logs
  currentTrainingStatus = {
    status: 'running',
    progress: 0,
    logs: 'Initializing training process...\n',
    error: null
  };

  fs.writeFileSync(logPath, currentTrainingStatus.logs);
  fs.writeFileSync(statusPath, JSON.stringify(currentTrainingStatus, null, 2));

  const scriptPath = path.join(trainingDir, 'train.py');
  console.log(`Spawning custom model training script: python3 ${scriptPath}`);
  
  const pyProcess = spawn('python3', [
    scriptPath,
    '--base-model', baseModel,
    '--epochs', String(epochs),
    '--samples', String(samples),
    '--ollama-url', ollamaUrl
  ]);

  pyProcess.stdout.on('data', (data) => {
    const output = data.toString();
    currentTrainingStatus.logs += output;
    
    // Parse progress if epoch indicator is found
    const epochMatch = output.match(/Epoch\s+(\d+)\/(\d+)/);
    if (epochMatch) {
      const currentEpoch = parseInt(epochMatch[1], 10);
      const totalEpochs = parseInt(epochMatch[2], 10);
      currentTrainingStatus.progress = Math.round((currentEpoch / totalEpochs) * 90); // cap training at 90% before completion
    }

    if (output.includes('=== MODEL TRAINING COMPLETE ===')) {
      currentTrainingStatus.progress = 100;
    }
    
    fs.appendFileSync(logPath, output);
    fs.writeFileSync(statusPath, JSON.stringify(currentTrainingStatus, null, 2));
  });

  pyProcess.stderr.on('data', (data) => {
    const errorOutput = data.toString();
    currentTrainingStatus.logs += `[ERROR] ${errorOutput}`;
    fs.appendFileSync(logPath, `[ERROR] ${errorOutput}`);
    fs.writeFileSync(statusPath, JSON.stringify(currentTrainingStatus, null, 2));
  });

  pyProcess.on('close', (code) => {
    if (code === 0) {
      currentTrainingStatus.status = 'completed';
      currentTrainingStatus.progress = 100;
      currentTrainingStatus.logs += '\nTraining completed successfully!\n';
    } else {
      currentTrainingStatus.status = 'error';
      currentTrainingStatus.error = `Python process exited with code ${code}`;
      currentTrainingStatus.logs += `\nTraining failed with exit code ${code}\n`;
    }
    fs.writeFileSync(statusPath, JSON.stringify(currentTrainingStatus, null, 2));
  });

  return res.json({ status: 'started', message: 'Training session initiated.' });
});

router.get('/train-status', async (req: AuthenticatedRequest, res: Response) => {
  const trainingDir = path.join(projectRoot, 'ml_models/architecture_generation');
  const statusPath = path.join(trainingDir, 'training_status.json');
  const logPath = path.join(trainingDir, 'training.log');

  if (fs.existsSync(statusPath)) {
    try {
      const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      if (fs.existsSync(logPath)) {
        statusData.logs = fs.readFileSync(logPath, 'utf-8');
      }
      return res.json(statusData);
    } catch (err: any) {
      return res.json({ ...currentTrainingStatus, error: err.message });
    }
  }

  return res.json(currentTrainingStatus);
});

export default router;

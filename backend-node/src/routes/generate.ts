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
    console.warn(`Gemini chat failed with exception: ${geminiErr}. Trying OpenAI fallback...`);
    replyText = `I am temporarily experiencing high demand (Gemini error: ${geminiErr}). Please wait 10-15 seconds and resend your message!`;
  }

  const replyTextLower = replyText.toLowerCase();
  if (replyTextLower.includes('quota') || replyTextLower.includes('rate limit')) {
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
  }

  if (replyTextLower.includes('rate limit') || replyTextLower.includes('high demand') || replyTextLower.includes('quota')) {
    replyText = (
      'I tried to route your request to your local Ollama instance (http://localhost:11434), ' +
      'but the connection was refused. I then tried falling back to Google Cloud APIs, ' +
      'but they are currently experiencing high demand/rate limits.\n\n' +
      '**Action Required**:\n' +
      '1. Please make sure Ollama is running on your computer (`ollama serve`).\n' +
      '2. If it\'s already running, ensure you have set `OLLAMA_ORIGINS=*` in your environment so your browser can connect to it.'
    );
  }

  return res.json({
    status: 'success',
    reply: replyText || 'I had a temporary connection issue. How else can I help?'
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

      return {
        id: data.generation_id || item.SK || '',
        type: 'generated',
        title: item.title || 'Untitled Architecture',
        platform: item.platform || 'AWS',
        services: nodes.length,
        cost: cost.total_monthly_cost || '$0.00',
        nodes: nodes,
        edges: data.edges || [],
        cost_details: cost,
        date: item.created_at || ''
      };
    });

    return res.json(historyList);
  } catch (e) {
    console.error(`Error fetching history from DynamoDB: ${e}`);
    return res.json([]);
  }
});

export default router;

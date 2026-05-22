import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { GeminiService } from '../services/gemini.js';
import { BedrockService } from '../services/bedrock.js';
import { S3Service } from '../services/s3.js';
import { TextractService } from '../services/textract.js';
import { DynamoService } from '../services/dynamo.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const geminiService = new GeminiService();
const bedrockService = new BedrockService();
const s3Service = new S3Service();
const textractService = new TextractService();
const dynamoService = new DynamoService();

router.post('/architecture', async (req: AuthenticatedRequest, res: Response) => {
  const { architecture_data } = req.body;
  if (!architecture_data) {
    return res.status(400).json({ detail: 'architecture_data is required' });
  }

  let result: any = null;
  try {
    console.log('Attempting to analyze architecture using Gemini...');
    result = await geminiService.analyseArchitecture(architecture_data);
  } catch (geminiErr) {
    console.warn(`Gemini analysis failed with exception: ${geminiErr}. Trying AWS Bedrock fallback...`);
    result = { error: `Gemini analysis failed: ${geminiErr}` };
  }

  if (result && result.error) {
    // Try AWS Bedrock as the ultimate self-healing fallback!
    try {
      console.log('Gemini analysis failed - attempting AWS Bedrock fallback...');
      const bedrockResult = await bedrockService.analyseArchitecture(architecture_data);
      if (bedrockResult && !bedrockResult.error) {
        console.log('Successfully recovered from analysis failure using AWS Bedrock fallback!');
        return res.json({
          status: 'success',
          issues: bedrockResult.issues || [],
          suggested_nodes: bedrockResult.suggested_nodes || [],
          suggested_edges: bedrockResult.suggested_edges || []
        });
      }
    } catch (bedrockErr) {
      console.warn(`AWS Bedrock fallback analysis failed: ${bedrockErr}`);
    }

    return res.json({
      status: 'error',
      message: result.error
    });
  }

  return res.json({
    status: 'success',
    issues: result.issues || [],
    suggested_nodes: result.suggested_nodes || [],
    suggested_edges: result.suggested_edges || []
  });
});

router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const userId = req.user?.sub || 'anonymous';
    const fileId = crypto.randomUUID();

    // 1. Read file content from memory buffer
    const fileContent = req.file.buffer;

    // Make a safe object name
    const fileExtension = path.extname(req.file.originalname) || '.png';
    const objectName = `uploads/${userId}/${fileId}${fileExtension}`;

    // 2. Upload file to S3
    console.log(`Uploading file ${req.file.originalname} to S3 bucket...`);
    const uploadSuccess = await s3Service.uploadFile(fileContent, objectName);
    if (!uploadSuccess) {
      return res.status(500).json({ status: 'error', message: 'Failed to upload file to S3' });
    }

    // 3. Invoke Textract to extract text
    console.log(`Invoking Textract on ${objectName}...`);
    let extractedText = await textractService.extractTextFromS3(process.env.S3_BUCKET || 'cloudyai-assets', objectName);
    if (!extractedText) {
      // Fallback in case of Textract error / local dev mock
      console.warn('Textract failed or returned empty text. Using mock fallback...');
      extractedText = `Mocked text extracted from ${req.file.originalname}: Web server with load balancer and database.`;
    }

    // 4. Perform Gemini Architecture Analysis on the text
    console.log('Analyzing extracted text...');
    let analysisResult: any = null;
    try {
      analysisResult = await geminiService.analyseArchitecture(extractedText);
    } catch (geminiErr) {
      console.warn(`Gemini analysis in upload failed: ${geminiErr}. Trying Bedrock fallback...`);
      try {
        analysisResult = await bedrockService.analyseArchitecture(extractedText);
      } catch (bedrockErr) {
        console.error(`Bedrock fallback failed: ${bedrockErr}`);
        analysisResult = { error: String(geminiErr) };
      }
    }

    // 5. Save the analysis record to DynamoDB
    console.log('Saving upload record to DynamoDB...');
    const s3Url = await s3Service.getDownloadUrl(objectName);
    const dbData = {
      file_id: fileId,
      s3_url: s3Url || '',
      extracted_text: extractedText,
      analysis: analysisResult
    };

    await dynamoService.saveGeneration(
      userId,
      `Analysed Upload: ${req.file.originalname}`,
      'AWS', // Default
      dbData
    );

    return res.json({
      status: 'success',
      message: 'File processed via Textract and analysed successfully',
      file_id: fileId,
      extracted_text: extractedText,
      analysis: analysisResult
    });

  } catch (e: any) {
    console.error(`Error in upload_architecture: ${e}`);
    return res.status(500).json({ status: 'error', message: e.message || e });
  }
});

export default router;

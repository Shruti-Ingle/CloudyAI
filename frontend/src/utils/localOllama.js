/**
 * Utility for direct browser-to-Ollama interactions.
 * Bypasses AWS Lambda to resolve localhost network isolation.
 */

const PLATFORM_QUESTIONS = {
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

/**
 * Get headers for API requests.
 */
function getHeaders(apiKey) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
  }
  return headers;
}

/**
 * Fetch available models from local Ollama instance.
 */
export async function fetchLocalModels(url = 'http://localhost:11434', apiKey = '') {
  const baseUrl = url.replace(/\/$/, '');
  const headers = getHeaders(apiKey);
  
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers
    });
    
    if (response.ok) {
      const data = await response.json();
      return (data.models || []).map(m => m.name);
    }
  } catch (err) {
    console.warn("Failed to fetch models from standard Ollama endpoint, trying OpenAI compatible one:", err);
  }
  
  // Try OpenAI compatible route as fallback for API gateways / proxies
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers
    });
    
    if (response.ok) {
      const data = await response.json();
      return (data.data || []).map(m => m.id);
    }
  } catch (err) {
    console.error("All model fetch attempts failed:", err);
  }
  
  return ['gemma3']; // Fallback
}

/**
 * Clean thinking blocks and formatting wrappers.
 */
function cleanResponseText(text) {
  if (!text) return '';
  // Strip DeepSeek think blocks
  let clean = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  // Strip Markdown JSON/text blocks if present
  clean = clean.replace(/^```json\s*/i, '');
  clean = clean.replace(/^```\s*/, '');
  clean = clean.replace(/\s*```$/, '');
  return clean.trim();
}

/**
 * Call the Ollama API directly.
 */
async function callOllama(url, apiKey, model, messages, systemPrompt, formatJson = false) {
  const baseUrl = url.replace(/\/$/, '');
  const headers = getHeaders(apiKey);
  
  const payloadMessages = [];
  if (systemPrompt) {
    payloadMessages.push({ role: 'system', content: systemPrompt });
  }
  payloadMessages.push(...messages);

  const payload = {
    model: model || 'gemma3',
    messages: payloadMessages,
    stream: false,
    options: {
      temperature: 0.2
    }
  };

  if (formatJson) {
    payload.format = 'json';
  }

  // Try standard Ollama chat
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      return cleanResponseText(data.message?.content);
    }
  } catch (err) {
    console.warn("Standard Ollama chat failed, trying OpenAI endpoint:", err);
  }

  // Fallback to OpenAI completions route (for LiteLLM/reverse proxies)
  try {
    const openAiPayload = {
      model: model || 'gemma3',
      messages: payloadMessages,
      temperature: 0.2,
      stream: false
    };
    
    if (formatJson) {
      openAiPayload.response_format = { type: "json_object" };
    }

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(openAiPayload)
    });

    if (response.ok) {
      const data = await response.json();
      return cleanResponseText(data.choices?.[0]?.message?.content);
    }
  } catch (err) {
    console.error("Direct Ollama fetch completely failed:", err);
    throw err;
  }
}

/**
 * Direct local chat response generator.
 */
export async function generateLocalChatResponse({
  url = 'http://localhost:11434',
  apiKey = '',
  model = 'gemma3',
  message,
  history,
  platform = 'AWS',
  questionIndex = 0
}) {
  const questionsList = PLATFORM_QUESTIONS[platform] || PLATFORM_QUESTIONS.AWS;
  
  let historyStr = "";
  if (history && history.length > 0) {
    historyStr = history.map(msg => {
      const role = msg.isBot ? "Cloudy AI" : "User";
      return `${role}: ${msg.text}`;
    }).join("\n") + "\n";
  }

  let systemPrompt = "";
  let prompt = "";

  if (questionIndex < questionsList.length) {
    const currentQuestion = questionsList[questionIndex];
    systemPrompt = `You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect assistant specialized in ${platform}.
The user is designing a cloud application. Your role is to have a natural, professional conversation to understand their needs and help them refine their architecture.

Rules:
1. Be friendly, conversational, and highly technical.
2. Keep your response brief and to the point (maximum 2 sentences).
3. Intelligently acknowledge the user's latest choice/message with expert technical insight.
4. At the end of your response, ask this EXACT question: '${currentQuestion}'
5. Do NOT ask any other questions. Do NOT output any JSON, YAML, code blocks, or diagram structures.`;

    prompt = `Conversation history:
${historyStr}User: ${message}

Instruction: Acknowledge user's input with brief tech insights, and then ask Question #${questionIndex + 1}: '${currentQuestion}'

Generate your technical response:`;
  } else {
    systemPrompt = `You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect assistant specialized in ${platform}.
The user is designing a cloud application.

Rules:
1. Be friendly, conversational, and highly technical.
2. Keep your response brief and to the point (maximum 2 sentences).
3. Let the user know that you have gathered all standard architectural inputs. Suggest that they can mention any additional requirements, or click the 'Generate Architecture' button below to create their design.
4. Do NOT ask any new questions. Do NOT output any JSON, YAML, code blocks, or diagram structures.`;

    prompt = `Conversation history:
${historyStr}User: ${message}

Instruction: Acknowledge user's input, let them know onboarding is complete, and suggest they click 'Generate Architecture' or mention additional requests.

Generate your technical response:`;
  }

  try {
    const reply = await callOllama(url, apiKey, model, [{ role: 'user', content: prompt }], systemPrompt);
    return { reply };
  } catch (err) {
    return {
      reply: "I had trouble talking to your local Ollama node. Please make sure Ollama is running and OLLAMA_ORIGINS is set appropriately!"
    };
  }
}

/**
 * Direct local architecture generation.
 */
export async function generateLocalArchitecture({
  url = 'http://localhost:11434',
  apiKey = '',
  model = 'gemma3',
  prompt,
  platform = 'AWS',
  history
}) {
  let contextStr = "";
  if (history && history.length > 0) {
    contextStr = "Conversation Context:\n" + history.map(msg => {
      const role = msg.isBot ? "Assistant (Cloudy AI)" : "User";
      return `- ${role}: ${msg.text}`;
    }).join("\n") + "\n\nNew requirement based on history:\n";
  }

  const fullPrompt = `${contextStr}Design a highly available and cost-optimized ${platform} architecture for: ${prompt}`;

  const systemPrompt = `You are an expert cloud architect specialized in ${platform}. Your task is to design a cost-optimized, highly available cloud architecture on ${platform} based on the user's request. You must output ONLY a valid JSON object containing 'nodes', 'edges', and 'cost' details. Do not include any explanations, markdown code blocks, or text outside the JSON.

Layout Rules (CRITICAL to prevent overlap):
1. Give nodes at least 250px vertical spacing and 300px horizontal spacing.
2. Establish a clear top-to-bottom layout:
   - Clients or DNS at y: 50
   - Gateways or CDNs at y: 200
   - Compute, Logic, or Containers at y: 350
   - Storage, Queues, or Databases at y: 500
3. If there are multiple nodes at the same tier, space them horizontally (e.g. x: 100, x: 400, x: 700).

Cost Estimation:
Provide realistic monthly cost details for all services.

Example structure:
{
  "nodes": [
    {"id": "1", "data": {"label": "React Frontend"}, "position": {"x": 400, "y": 50}},
    {"id": "2", "data": {"label": "API Gateway"}, "position": {"x": 400, "y": 200}},
    {"id": "3", "data": {"label": "Lambda Function"}, "position": {"x": 400, "y": 350}},
    {"id": "4", "data": {"label": "DynamoDB Table"}, "position": {"x": 400, "y": 500}}
  ],
  "edges": [
    {"id": "e1-2", "source": "1", "target": "2"},
    {"id": "e2-3", "source": "2", "target": "3"},
    {"id": "e3-4", "source": "3", "target": "4"}
  ],
  "cost": {
    "total_monthly_cost": "$15.20",
    "services": [
      {"name": "API Gateway", "monthly_cost": "$3.50", "breakdown": "Based on 1M requests per month ($3.50/million)"},
      {"name": "AWS Lambda", "monthly_cost": "$0.20", "breakdown": "1M executions with free tier covering compute time"},
      {"name": "Amazon DynamoDB", "monthly_cost": "$11.50", "breakdown": "25 GB storage and provisioned capacity"}
    ]
  }
}`;

  try {
    const rawResult = await callOllama(url, apiKey, model, [{ role: 'user', content: fullPrompt }], systemPrompt, true);
    
    // Parse JSON
    try {
      const parsed = JSON.parse(rawResult);
      return {
        status: 'success',
        ...parsed
      };
    } catch (parseErr) {
      console.warn("JSON parsing failed on raw content. Trying to extract object:", parseErr);
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          status: 'success',
          ...parsed
        };
      }
      throw new Error("Could not parse JSON response from local Ollama model.");
    }
  } catch (err) {
    console.error("Local architecture generation failed:", err);
    throw err;
  }
}

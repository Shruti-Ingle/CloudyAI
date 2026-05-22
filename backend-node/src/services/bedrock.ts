import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { getSystemPrompt } from '../utils/promptBuilder.js';
import { ChatMessage } from './gemini.js';

export class BedrockService {
  private client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  private _getFallbackArchitecture(prompt: string, platform: string = 'AWS'): any {
    let plat = platform.toUpperCase();
    if (plat !== 'AWS' && plat !== 'GCP' && plat !== 'AZURE') {
      plat = 'AWS';
    }

    const promptLower = prompt.toLowerCase();

    // Color palettes for styling matching each cloud provider's premium aesthetic
    const colors: Record<string, Record<string, string>> = {
      AWS: { primary: '#FF9900', secondary: '#232F3E', accent: '#4F46E5', db: '#10B981', storage: '#EF4444', dns: '#D97706' },
      GCP: { primary: '#4285F4', secondary: '#0F9D58', accent: '#DB4437', db: '#F4B400', storage: '#4285F4', dns: '#0F9D58' },
      AZURE: { primary: '#0078D4', secondary: '#5C2D91', accent: '#F25022', db: '#00B0F0', storage: '#7FBA00', dns: '#0078D4' }
    };
    const c = colors[plat];

    let nodes: any[] = [];
    let edges: any[] = [];
    let cost: any = {};

    // Static Website / CDN
    if (['static', 'website', 's3', 'frontend', 'cdn'].some(w => promptLower.includes(w))) {
      const dnsLbl = plat === 'AWS' ? 'Route 53 (DNS)' : (plat === 'GCP' ? 'Cloud DNS' : 'Azure DNS');
      const cdnLbl = plat === 'AWS' ? 'CloudFront CDN' : (plat === 'GCP' ? 'Cloud CDN' : 'Azure Front Door CDN');
      const storageLbl = plat === 'AWS' ? 'S3 Static Hosting' : (plat === 'GCP' ? 'Cloud Storage Hosting' : 'Azure Blob Web Hosting');
      const sslLbl = plat === 'AWS' ? 'ACM (SSL/TLS)' : (plat === 'GCP' ? 'Google Managed Certificate' : 'Azure App Service Certificate');

      nodes = [
        { id: 'dns', position: { x: 400, y: 50 }, data: { label: dnsLbl }, style: { background: c.dns, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'cdn', position: { x: 100, y: 200 }, data: { label: cdnLbl }, style: { background: c.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 's3', position: { x: 400, y: 200 }, data: { label: storageLbl }, style: { background: c.db, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'ssl', position: { x: 700, y: 200 }, data: { label: sslLbl }, style: { background: c.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
      ];
      edges = [
        { id: 'e-dns-cdn', source: 'dns', target: 'cdn', animated: true, style: { stroke: c.dns } },
        { id: 'e-cdn-s3', source: 'cdn', target: 's3', animated: true, style: { stroke: c.primary } },
        { id: 'e-ssl-cdn', source: 'ssl', target: 'cdn', style: { stroke: c.accent, strokeDasharray: '5,5' } },
      ];

      cost = {
        total_monthly_cost: plat === 'AZURE' ? '$15.10' : '$13.70',
        services: [
          { name: dnsLbl, monthly_cost: plat === 'GCP' ? '$0.40' : '$0.50', breakdown: 'DNS zone lookup costs' },
          { name: cdnLbl, monthly_cost: plat === 'GCP' ? '$10.50' : '$11.20', breakdown: '100 GB egress global bandwidth' },
          { name: storageLbl, monthly_cost: plat === 'GCP' ? '$2.80' : '$3.40', breakdown: 'Static assets file storage space' }
        ]
      };
    }
    // E-commerce / Complex Microservices
    else if (['commerce', 'shop', 'store', 'microservice', 'order'].some(w => promptLower.includes(w))) {
      const authLbl = plat === 'AWS' ? 'Cognito Auth' : (plat === 'GCP' ? 'Identity Platform Auth' : 'Entra ID Auth');
      const gwLbl = plat === 'AWS' ? 'API Gateway' : (plat === 'GCP' ? 'Cloud API Gateway' : 'Azure API Management');
      const comp1Lbl = plat === 'AWS' ? 'Products Lambda' : (plat === 'GCP' ? 'Products Cloud Run' : 'Products Container App');
      const comp2Lbl = plat === 'AWS' ? 'Orders Lambda' : (plat === 'GCP' ? 'Orders Cloud Run' : 'Orders Container App');
      const db1Lbl = plat === 'AWS' ? 'DynamoDB Products' : (plat === 'GCP' ? 'Firestore Products' : 'Cosmos DB Products');
      const db2Lbl = plat === 'AWS' ? 'DynamoDB Orders' : (plat === 'GCP' ? 'Firestore Orders' : 'Cosmos DB Orders');

      nodes = [
        { id: 'client', position: { x: 400, y: 50 }, data: { label: 'React Web App' }, style: { background: c.dns, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'cognito', position: { x: 100, y: 200 }, data: { label: authLbl }, style: { background: c.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'api', position: { x: 400, y: 200 }, data: { label: gwLbl }, style: { background: c.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'lambda_prod', position: { x: 100, y: 350 }, data: { label: comp1Lbl }, style: { background: c.dns, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'lambda_order', position: { x: 400, y: 350 }, data: { label: comp2Lbl }, style: { background: c.dns, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'db_prod', position: { x: 100, y: 500 }, data: { label: db1Lbl }, style: { background: c.db, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'db_order', position: { x: 400, y: 500 }, data: { label: db2Lbl }, style: { background: c.db, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
      ];
      edges = [
        { id: 'e-client-api', source: 'client', target: 'api', animated: true, style: { stroke: c.dns } },
        { id: 'e-client-auth', source: 'client', target: 'cognito', style: { stroke: c.accent, strokeDasharray: '3,3' } },
        { id: 'e-api-prod', source: 'api', target: 'lambda_prod', animated: true, style: { stroke: c.primary } },
        { id: 'e-api-order', source: 'api', target: 'lambda_order', animated: true, style: { stroke: c.primary } },
        { id: 'e-prod-db', source: 'lambda_prod', target: 'db_prod', style: { stroke: c.dns } },
        { id: 'e-order-db', source: 'lambda_order', target: 'db_order', style: { stroke: c.dns } },
      ];

      cost = {
        total_monthly_cost: plat === 'GCP' ? '$96.00' : (plat === 'AZURE' ? '$104.50' : '$89.50'),
        services: [
          { name: authLbl, monthly_cost: '$0.00', breakdown: 'Free Tier for first 50k MAUs' },
          { name: gwLbl, monthly_cost: '$4.00', breakdown: 'Based on 1.2 million requests' },
          { name: `${comp1Lbl} / ${comp2Lbl}`, monthly_cost: '$32.00', breakdown: 'Active compute cores scaling' },
          { name: `${db1Lbl} / ${db2Lbl}`, monthly_cost: '$60.00', breakdown: 'Multi-region replicated database tier' }
        ]
      };
    }
    // Real-time / Messaging / WebSockets
    else if (['chat', 'realtime', 'real-time', 'websocket', 'message'].some(w => promptLower.includes(w))) {
      const gwLbl = plat === 'AWS' ? 'API Gateway (WebSockets)' : (plat === 'GCP' ? 'Cloud API Gateway' : 'Azure API Management');
      const compLbl = plat === 'AWS' ? 'WebSocket Manager (Lambda)' : (plat === 'GCP' ? 'WebSocket Manager (Cloud Run)' : 'WebSocket Manager (Container Apps)');
      const redisLbl = plat === 'AWS' ? 'ElastiCache Redis' : (plat === 'GCP' ? 'Memorystore for Redis' : 'Azure Cache for Redis');
      const dbLbl = plat === 'AWS' ? 'DynamoDB (Sessions)' : (plat === 'GCP' ? 'Firestore (Sessions)' : 'Cosmos DB (Sessions)');

      nodes = [
        { id: 'client', position: { x: 400, y: 50 }, data: { label: 'Web Client' }, style: { background: c.dns, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'api', position: { x: 400, y: 200 }, data: { label: gwLbl }, style: { background: c.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'lambda', position: { x: 400, y: 350 }, data: { label: compLbl }, style: { background: c.dns, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'redis', position: { x: 100, y: 500 }, data: { label: redisLbl }, style: { background: c.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'db', position: { x: 400, y: 500 }, data: { label: dbLbl }, style: { background: c.db, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
      ];
      edges = [
        { id: 'e-client-api', source: 'client', target: 'api', animated: true, style: { stroke: c.dns } },
        { id: 'e-api-lambda', source: 'api', target: 'lambda', animated: true, style: { stroke: c.primary } },
        { id: 'e-lambda-redis', source: 'lambda', target: 'redis', style: { stroke: c.accent } },
        { id: 'e-lambda-db', source: 'lambda', target: 'db', style: { stroke: c.db } },
      ];

      cost = {
        total_monthly_cost: plat === 'GCP' ? '$65.00' : (plat === 'AZURE' ? '$78.00' : '$68.50'),
        services: [
          { name: gwLbl, monthly_cost: '$6.50', breakdown: 'WebSocket active connections fee' },
          { name: compLbl, monthly_cost: '$15.00', breakdown: 'Stateless socket event processing compute' },
          { name: redisLbl, monthly_cost: '$29.00', breakdown: 'Basic cache instance class for socket routing' },
          { name: dbLbl, monthly_cost: '$18.00', breakdown: 'Active connection states database lookup' }
        ]
      };
    }
    // Monolith / Traditional VM hosting
    else if (['monolith', 'legacy', 'vm', 'ec2', 'server', 'rds'].some(w => promptLower.includes(w))) {
      const albLbl = plat === 'AWS' ? 'Application Load Balancer' : (plat === 'GCP' ? 'Cloud Load Balancing' : 'Azure Application Gateway');
      const compLbl = plat === 'AWS' ? 'EC2 Autoscaling Group' : (plat === 'GCP' ? 'Compute Engine Managed Instance Group' : 'Azure Virtual Machine Scale Sets');
      const dbLbl = plat === 'AWS' ? 'RDS Postgres (Multi-AZ)' : (plat === 'GCP' ? 'Cloud SQL Postgres' : 'Azure Database for PostgreSQL');

      nodes = [
        { id: 'client', position: { x: 400, y: 50 }, data: { label: 'Web Client' }, style: { background: c.dns, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'alb', position: { x: 400, y: 200 }, data: { label: albLbl }, style: { background: c.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'ec2', position: { x: 400, y: 350 }, data: { label: compLbl }, style: { background: c.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'rds', position: { x: 400, y: 500 }, data: { label: dbLbl }, style: { background: c.db, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
      ];
      edges = [
        { id: 'e-client-alb', source: 'client', target: 'alb', animated: true, style: { stroke: c.dns } },
        { id: 'e-alb-ec2', source: 'alb', target: 'ec2', animated: true, style: { stroke: c.primary } },
        { id: 'e-ec2-rds', source: 'ec2', target: 'rds', style: { stroke: c.db } },
      ];

      cost = {
        total_monthly_cost: plat === 'GCP' ? '$83.50' : (plat === 'AZURE' ? '$98.20' : '$87.40'),
        services: [
          { name: albLbl, monthly_cost: plat === 'GCP' ? '$18.00' : '$22.00', breakdown: 'Incoming connections high availability routing' },
          { name: compLbl, monthly_cost: '$32.00', breakdown: '2x virtual machine active scaling cores' },
          { name: dbLbl, monthly_cost: plat === 'GCP' ? '$33.50' : '$42.00', breakdown: 'Managed relational multi-AZ SQL instance with 10 GB backup space' }
        ]
      };
    }
    // Default Serverless Stack
    else {
      const gwLbl = plat === 'AWS' ? 'API Gateway' : (plat === 'GCP' ? 'Cloud API Gateway' : 'Azure API Management');
      const compLbl = plat === 'AWS' ? 'AWS Lambda (Backend)' : (plat === 'GCP' ? 'Cloud Run (Backend)' : 'Azure Container Apps (Backend)');
      const dbLbl = plat === 'AWS' ? 'DynamoDB Database' : (plat === 'GCP' ? 'Cloud SQL Database' : 'Cosmos DB Database');
      const storageLbl = plat === 'AWS' ? 'S3 Storage Bucket' : (plat === 'GCP' ? 'Cloud Storage Bucket' : 'Azure Blob Storage');

      nodes = [
        { id: 'client', position: { x: 400, y: 50 }, data: { label: 'Web Client (React)' }, style: { background: c.dns, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'api', position: { x: 400, y: 200 }, data: { label: gwLbl }, style: { background: c.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'lambda', position: { x: 400, y: 350 }, data: { label: compLbl }, style: { background: c.dns, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 'db', position: { x: 100, y: 500 }, data: { label: dbLbl }, style: { background: c.db, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
        { id: 's3', position: { x: 400, y: 500 }, data: { label: storageLbl }, style: { background: c.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
      ];
      edges = [
        { id: 'e-client-api', source: 'client', target: 'api', animated: true, style: { stroke: c.dns } },
        { id: 'e-api-lambda', source: 'api', target: 'lambda', animated: true, style: { stroke: c.primary } },
        { id: 'e-lambda-db', source: 'lambda', target: 'db', animated: true, style: { stroke: c.db } },
        { id: 'e-lambda-s3', source: 'lambda', target: 's3', animated: true, style: { stroke: c.accent } },
      ];

      cost = {
        total_monthly_cost: plat === 'GCP' ? '$56.00' : (plat === 'AZURE' ? '$65.80' : '$52.40'),
        services: [
          { name: gwLbl, monthly_cost: '$3.50', breakdown: 'REST API gateway calls routing' },
          { name: compLbl, monthly_cost: '$12.00', breakdown: 'Stateless serverless compute scaling' },
          { name: dbLbl, monthly_cost: plat === 'GCP' ? '$31.80' : '$42.00', breakdown: 'Managed database storage resources' },
          { name: storageLbl, monthly_cost: plat === 'GCP' ? '$5.10' : '$8.30', breakdown: 'Object file storage space' }
        ]
      };
    }

    return { nodes, edges, cost };
  }

  private _getFallbackAnalysis(architectureData: string): any {
    const issues = [
      {
        severity: 'Critical',
        title: 'Single Instance Dependency',
        description: 'The architecture shows resources grouped without auto-scaling or multi-AZ configuration.',
        suggestion: 'Implement an Auto Scaling Group and deploy across multiple Availability Zones with an ALB.'
      },
      {
        severity: 'Warning',
        title: 'Uncached Database Reads',
        description: 'Database queries go directly to primary storage on all web requests.',
        suggestion: 'Introduce an Amazon ElastiCache (Redis) cluster or DAX layer to cache frequent queries.'
      },
      {
        severity: 'Info',
        title: 'No Edge Caching / CDN',
        description: 'Static web pages or media resources are served directly from centralized hosting servers.',
        suggestion: 'Provision an Amazon CloudFront distribution to cache assets globally and reduce load times.'
      }
    ];

    const suggested_nodes = [
      { id: 'client', position: { x: 250, y: 50 }, data: { label: 'Web Client' }, style: { background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
      { id: 'api', position: { x: 250, y: 150 }, data: { label: 'API Gateway / ALB' }, style: { background: '#06B6D4', color: '#fff', border: '2px solid #164E63', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
      { id: 'lambda', position: { x: 250, y: 250 }, data: { label: 'Lambda / Auto-Scaling Compute' }, style: { background: '#10B981', color: '#fff', border: '2px solid #065F46', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
      { id: 'db', position: { x: 250, y: 350 }, data: { label: 'RDS/DynamoDB (Multi-AZ)' }, style: { background: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' } },
    ];

    const suggested_edges = [
      { id: 'e1-2', source: 'client', target: 'api', animated: true, style: { stroke: '#06B6D4' } },
      { id: 'e2-3', source: 'api', target: 'lambda', animated: true, style: { stroke: '#10B981' } },
      { id: 'e3-4', source: 'lambda', target: 'db', style: { stroke: '#475569' } },
    ];

    return {
      issues,
      suggested_nodes,
      suggested_edges
    };
  }

  public async generateArchitecture(prompt: string, platform: string = 'AWS', history: ChatMessage[] | null = null): Promise<any> {
    const modelId = 'anthropic.claude-3-haiku-20240307-v1:0';

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

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: fullUserPrompt
        }
      ]
    });

    try {
      const response = await this.client.send(new InvokeModelCommand({
        modelId,
        body: new TextEncoder().encode(body),
        contentType: 'application/json',
        accept: 'application/json'
      }));

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const textResponse = responseBody.content[0].text;

      try {
        return JSON.parse(textResponse.trim());
      } catch (jsonErr) {
        const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          return JSON.parse(jsonMatch[1].trim());
        }
        return this._getFallbackArchitecture(prompt, platform);
      }
    } catch (error) {
      console.warn(`Error invoking Bedrock: ${error}. Using dynamic fallback service.`);
      return this._getFallbackArchitecture(prompt, platform);
    }
  }

  public async analyseArchitecture(architectureData: string): Promise<any> {
    const modelId = 'anthropic.claude-3-haiku-20240307-v1:0';
    const systemPrompt = "You are an expert cloud architect. Analyze the provided architecture and return a JSON object with 'issues' (list of objects with severity, title, description, suggestion) and 'suggested_nodes' and 'suggested_edges' arrays for React Flow. Do not include any explanations, markdown code blocks, or text outside the JSON.";

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze this architecture: ${architectureData}`
        }
      ]
    });

    try {
      const response = await this.client.send(new InvokeModelCommand({
        modelId,
        body: new TextEncoder().encode(body),
        contentType: 'application/json',
        accept: 'application/json'
      }));

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const textResponse = responseBody.content[0].text;

      try {
        return JSON.parse(textResponse.trim());
      } catch (jsonErr) {
        const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          return JSON.parse(jsonMatch[1].trim());
        }
        return this._getFallbackAnalysis(architectureData);
      }
    } catch (error) {
      console.warn(`Error invoking Bedrock: ${error}. Using dynamic fallback service.`);
      return this._getFallbackAnalysis(architectureData);
    }
  }
}

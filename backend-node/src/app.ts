import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeConfig } from './config/index.js';
import { getCurrentUser } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import generateRouter from './routes/generate.js';
import analyseRouter from './routes/analyse.js';
import userRouter from './routes/user.js';

const app = express();
const port = process.env.PORT || 8000;

// Set up CORS configurations
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const isAllowed = allowedOrigins.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin);
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global middleware to populate current user identity from JWT
app.use(getCurrentUser);

// Register routers
app.use('/auth', authRouter);
app.use('/generate', generateRouter);
app.use('/analyse', analyseRouter);
app.use('/user', userRouter);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  return res.json({ status: 'ok', message: 'CloudyAI API is running' });
});

// App initialization promise for Lambda
export const initPromise = (async () => {
  try {
    console.log('Loading configurations and AWS Secrets...');
    return await initializeConfig();
  } catch (error) {
    console.error('Fatal: Failed to load config/secrets:', error);
    throw error;
  }
})();

// Start server locally if not running in AWS Lambda
const isLambda = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV);
if (!isLambda) {
  initPromise.then(() => {
    app.listen(port, () => {
      console.log(`🚀 CloudyAI Node.js Backend is running at http://localhost:${port}`);
    });
  }).catch((error) => {
    console.error('Fatal: Failed to start backend app:', error);
    process.exit(1);
  });
}

export default app;

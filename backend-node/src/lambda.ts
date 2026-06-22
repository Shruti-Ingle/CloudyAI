import serverless from 'serverless-http';
import app, { initPromise } from './app.js';

let serverlessHandler: any;

export const handler = async (event: any, context: any) => {
  // Wait for configurations/secrets to be fully initialized on first call/cold start
  await initPromise;
  
  if (!serverlessHandler) {
    serverlessHandler = serverless(app);
  }
  
  return serverlessHandler(event, context);
};

import { Request, Response, NextFunction } from 'express';
import { decodeAccessToken } from '../utils/jwtHandler.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    name?: string;
    mock?: boolean;
    [key: string]: any;
  };
}

export function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  
  if (!authorization) {
    req.user = { sub: 'anonymous', email: 'anonymous@example.com' };
    return next();
  }

  if (!authorization.startsWith('Bearer ')) {
    req.user = { sub: 'anonymous', email: 'anonymous@example.com' };
    return next();
  }

  const token = authorization.split(' ')[1];

  if (token.startsWith('mock_jwt_token_')) {
    const userId = token.replace('mock_jwt_token_', '');
    req.user = {
      sub: userId,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      mock: true
    };
    return next();
  }

  const payload = decodeAccessToken(token);
  if (!payload) {
    req.user = { sub: 'anonymous', email: 'anonymous@example.com' };
    return next();
  }

  req.user = payload;
  next();
}

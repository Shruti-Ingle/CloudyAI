import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/profile', (req: AuthenticatedRequest, res: Response) => {
  if (req.user && req.user.sub !== 'anonymous') {
    return res.json({
      id: req.user.sub,
      name: req.user.name || 'Demo Company',
      email: req.user.email || 'admin@democompany.com',
      plan: 'Pro'
    });
  }
  return res.json({
    id: 1,
    name: 'Demo Company',
    email: 'admin@democompany.com',
    plan: 'Pro'
  });
});

export default router;

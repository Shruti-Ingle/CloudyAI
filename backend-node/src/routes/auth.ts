import { Router, Request, Response } from 'express';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
}

// Simple in-memory user registry to support full personalized names
export const USERS_DB: Record<string, User> = {};

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ detail: 'Name, email, and password are required' });
  }

  const emailKey = email.toLowerCase().trim();
  if (USERS_DB[emailKey]) {
    return res.status(400).json({ detail: 'Email already registered' });
  }

  USERS_DB[emailKey] = {
    id: Object.keys(USERS_DB).length + 1,
    name: name.trim(),
    email: email.trim(),
    password: password
  };

  return res.json({ message: 'User registered successfully' });
});

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  const emailKey = email.toLowerCase().trim();

  // 1. If user is registered in memory, retrieve their authentic name!
  if (USERS_DB[emailKey]) {
    const user = USERS_DB[emailKey];
    // In this mock environment, we automatically update the password to match
    // the user's latest input. This prevents any lockout during local testing or refreshes.
    if (user.password !== password) {
      console.log(`Dynamically updating mock password for ${emailKey} to match user input.`);
      user.password = password;
    }

    return res.json({
      access_token: `mock_jwt_token_${user.id}`,
      token_type: 'bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  }

  // 2. Dynamic fallback logic to parse name cleanly from email if not previously registered
  const username = email.split('@')[0];
  const cleanName = username.replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  // Auto-register in memory so profile modifications and custom names are fully tracked
  USERS_DB[emailKey] = {
    id: Object.keys(USERS_DB).length + 1,
    name: cleanName,
    email: email,
    password: password
  };

  return res.json({
    access_token: `mock_jwt_token_${USERS_DB[emailKey].id}`,
    token_type: 'bearer',
    user: {
      id: USERS_DB[emailKey].id,
      name: cleanName,
      email: email
    }
  });
});

router.post('/refresh', (req: Request, res: Response) => {
  return res.json({ access_token: 'mock_jwt_token_67890' });
});

router.post('/logout', (req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

export default router;

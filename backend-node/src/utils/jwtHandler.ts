import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';
const ALGORITHM = 'HS256';

export function createAccessToken(data: object, expiresInMinutes: number = 15): string {
  return jwt.sign(data, SECRET_KEY, {
    algorithm: ALGORITHM,
    expiresIn: `${expiresInMinutes}m`
  });
}

export function decodeAccessToken(token: string): any {
  try {
    return jwt.verify(token, SECRET_KEY, {
      algorithms: [ALGORITHM]
    });
  } catch (error) {
    return null;
  }
}

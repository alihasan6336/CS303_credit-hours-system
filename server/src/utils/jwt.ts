
import jwt from 'jsonwebtoken';

export interface JwtPayload {id: string;email: string;}

export type TokenExpiry = '1d' | '7d' | '30d';

export const signToken = (
  id: string,
  email: string,
  rememberMe = false
): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined in .env');

  const expiresIn: TokenExpiry = rememberMe ? '30d' : '1d';

  const payload: JwtPayload = { id, email };

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined in .env');

  return jwt.verify(token, secret) as JwtPayload;
};

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Shared error response for all limiters
const limitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please wait a moment and try again.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// Auth limiter - for login/register routes
// 15 attempts per 15 minutes, only failed requests count
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  handler: limitHandler,
});

// General API limiter - applied globally to all /api/* routes
// 300 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request): boolean => {
    const trustedIPs = process.env.TRUSTED_IPS?.split(',').map(ip => ip.trim()) || [];
    return trustedIPs.includes(req.ip || '');
  },
  handler: limitHandler,
});

// Enrollment limiter - for course enrollment during high-traffic registration
// 10 requests per minute per student
export const enrollmentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request): string => {
    const student = (req as any).student;
    return `${req.ip}-${student?._id || 'anonymous'}`;
  },
  handler: limitHandler,
});

// Admin action limiter - for admin write operations
// 30 requests per minute per IP
export const adminActionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  handler: limitHandler,
});

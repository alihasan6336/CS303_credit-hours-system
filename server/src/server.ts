import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import homeRoutes from './routes/homeRoutes';
import courseRoutes from './routes/courseRoutes';
import adminRoutes from './routes/adminRoutes';
import courseAssignmentRoutes from './routes/courseAssignmentRoutes';
import permissionRoutes from './routes/permissionRoutes';
import auditRoutes from './routes/auditRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import gpaRoutes from './routes/gpaRoutes';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Custom sanitizer for req.body (Express 5 compatible - doesn't touch req.query)
const sanitizeBody = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    const prohibited = ['$', '$gt', '$lt', '$gte', '$lte', '$ne', '$or', '$and', '$not', '$nor', '$exists', '$regex'];
    for (const key of Object.keys(obj)) {
      if (prohibited.some(p => key.startsWith(p))) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };
  if (req.body) sanitize(req.body);
  next();
};

// Security middleware
app.use(helmet());
app.use(cors());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:8081','http://192.168.1.6:5000',process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody); // Custom sanitizer for Express 5 compatibility

// Global rate limiter for all API routes
app.use('/api', apiLimiter);

// Basic health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the APIs for credit hours system' });
});

// API routes with auth rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/course-assignments', courseAssignmentRoutes);
app.use('/api/admin/permissions', permissionRoutes);
app.use('/api/admin/audit', auditRoutes);
app.use('/api/admin/enrollments', enrollmentRoutes);
app.use('/api/gpa', gpaRoutes);

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// Global error handler - MUST BE LAST
app.use(errorHandler);

// Start server with graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown handlers
const shutdown = (signal: string) => {
  console.log(`\n${signal} received — shutting down...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});

export default app;

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes   from './routes/authRoutes';
import homeRoutes   from './routes/homeRoutes';
import courseRoutes from './routes/courseRoutes';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  res.json({ message: 'Welcome to the APIs for cridit' });
});
app.get('/api/health',  (_req, res) => res.json({ status: 'all ok' }));

//  PUBLIC  routes inside authRoutes: /register  /login  /forgot-password  /reset-password/:token
//  PROTECTED routes inside authRoutes: /me

app.use('/api/auth',    authRoutes);
app.use('/api/home',    homeRoutes);
app.use('/api/courses', courseRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

export default app;

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import homeRoutes from './routes/homeRoutes';
import courseRoutes from './routes/courseRoutes';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',          
  'http://localhost:4173',          
  process.env.CLIENT_URL,           
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the APIs for cridit' });
});
app.get('/api/health', (_req, res) => res.json({ status: 'all ok' }));

//  PUBLIC  routes inside authRoutes: /register  /login  /forgot-password  /reset-password/:token
//  PROTECTED routes inside authRoutes: /me

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/courses', courseRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

export default app;

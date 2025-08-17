import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { projectRouter } from './routes/projects';
import { kpiRouter } from './routes/kpis';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/projects', projectRouter);
app.use('/api/kpis', kpiRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env['NODE_ENV']}`);
  console.log(`🔗 Frontend URL: ${process.env['FRONTEND_URL']}`);
});

export default app;

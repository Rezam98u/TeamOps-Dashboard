import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, refreshUserToken, getUserProfile } from '../services/authService';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth';

const router = Router();

// Register endpoint
router.post('/register', validate(z.object({ body: registerSchema })), async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Login endpoint
router.post('/login', validate(z.object({ body: loginSchema })), async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Refresh token endpoint
router.post('/refresh', validate(z.object({ body: refreshTokenSchema })), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshUserToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token refresh failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Logout endpoint
router.post('/logout', (_req: Request, res: Response) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
  });

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// Get current user profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await getUserProfile(req.user!.id);
    
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Profile not found',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as authRouter };

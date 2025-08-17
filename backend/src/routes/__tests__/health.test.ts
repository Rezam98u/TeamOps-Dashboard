import request from 'supertest';
import app from '../../index';

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
  })),
}));

describe('Health Endpoint', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'API is healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('database', 'connected');
  });
});

import request from 'supertest';
import app from '../../index';

// Mock auth to inject roles without real JWT/DB
jest.mock('../../middleware/auth', () => {
	const { AppError } = require('../../middleware/errorHandler');
	let currentRole = 'ADMIN';
	let currentUserId = 'ckuseradmin00000000000000001';
	const requireAuth = (req: any, _res: any, next: any) => {
		req.user = { id: currentUserId, email: 'test@teamops.com', role: currentRole };
		next();
	};
	const requireRole = (roles: string[]) => (req: any, _res: any, next: any) => {
		if (!req.user) return next(new AppError('Authentication required', 401));
		if (!roles.includes(req.user.role)) return next(new AppError('Insufficient permissions', 403));
		next();
	};
	return {
		requireAuth,
		requireAdmin: requireRole(['ADMIN']),
		requireManager: requireRole(['ADMIN', 'MANAGER']),
		requireEmployee: requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']),
		__setTestAuth: (role: string, userId: string = 'ckuseradmin00000000000000001') => {
			currentRole = role;
			currentUserId = userId;
		},
	};
});

// Central Prisma mock used by services (avoid hoist issues by keeping inside factory)
jest.mock('@prisma/client', () => {
	const store = {
		user: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
	} as any;
	(global as any).__PRISMA__ = store;
	return {
		PrismaClient: function () { return store; },
		UserRole: { ADMIN: 'ADMIN', MANAGER: 'MANAGER', EMPLOYEE: 'EMPLOYEE' },
	};
});

const getPrisma = () => (global as any).__PRISMA__ as any;

describe('Users Routes', () => {
	const authMock: any = jest.requireMock('../../middleware/auth');

	beforeEach(() => {
		jest.clearAllMocks();
		authMock.__setTestAuth('ADMIN', 'ckuseradmin00000000000000001');
	});

	test('GET /api/users returns list for admin, 200', async () => {
		getPrisma().user.findMany.mockResolvedValueOnce([
			{ id: 'ckuser000000000000000000001', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'EMPLOYEE', isActive: true, createdAt: new Date(), updatedAt: new Date() },
		]);
		const res = await request(app).get('/api/users');
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(getPrisma().user.findMany).toHaveBeenCalled();
	});

	test('GET /api/users forbidden for manager (RBAC 403)', async () => {
		authMock.__setTestAuth('MANAGER', 'ckusermanager000000000000001');
		const res = await request(app).get('/api/users');
		expect(res.status).toBe(403);
	});

	test('GET /api/users/:id allows self for non-admin, 200', async () => {
		authMock.__setTestAuth('EMPLOYEE', 'ckuseremployee00000000000001');
		getPrisma().user.findUnique.mockResolvedValueOnce({
			id: 'ckuseremployee00000000000001', email: 'e@x.com', firstName: 'E', lastName: 'X', role: 'EMPLOYEE', isActive: true, createdAt: new Date(), updatedAt: new Date(),
		});
		const res = await request(app).get('/api/users/ckuseremployee00000000000001');
		expect(res.status).toBe(200);
	});

	test('POST /api/users creates user for admin, 201', async () => {
		// uniqueness check
		getPrisma().user.findUnique.mockResolvedValueOnce(null);
		getPrisma().user.create.mockResolvedValueOnce({
			id: 'ckuser000000000000000000002', email: 'new@user.com', firstName: 'New', lastName: 'User', role: 'EMPLOYEE', isActive: true, createdAt: new Date(), updatedAt: new Date(),
		});
		const res = await request(app)
			.post('/api/users')
			.send({ email: 'new@user.com', password: 'Password1a', firstName: 'New', lastName: 'User', role: 'EMPLOYEE', isActive: true });
		expect(res.status).toBe(201);
		expect(getPrisma().user.create).toHaveBeenCalled();
	});

	test('PUT /api/users/:id non-admin cannot change role/isActive', async () => {
		authMock.__setTestAuth('EMPLOYEE', 'ckuseremployee00000000000001');
		getPrisma().user.findUnique.mockResolvedValueOnce({ id: 'ckuseremployee00000000000001', email: 'e@x.com' });
		getPrisma().user.update.mockResolvedValueOnce({
			id: 'ckuseremployee00000000000001', email: 'e2@x.com', firstName: 'E', lastName: 'X', role: 'EMPLOYEE', isActive: true, createdAt: new Date(), updatedAt: new Date(),
		});
		const res = await request(app)
			.put('/api/users/ckuseremployee00000000000001')
			.send({ email: 'e2@x.com', role: 'ADMIN', isActive: false });
		expect(res.status).toBe(200);
		// Ensure update called without role/isActive fields (service strips them)
		const updateArgs = getPrisma().user.update.mock.calls[0][0];
		expect(updateArgs.data.role).toBeUndefined();
		expect(updateArgs.data.isActive).toBeUndefined();
	});

	test('DELETE /api/users/:id admin only, manager gets 403', async () => {
		authMock.__setTestAuth('MANAGER', 'ckusermanager000000000000001');
		const res = await request(app).delete('/api/users/ckuser000000000000000000001');
		expect(res.status).toBe(403);
	});
});



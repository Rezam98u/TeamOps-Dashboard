import request from 'supertest';
import app from '../../index';

jest.mock('../../middleware/auth', () => {
	const { AppError } = require('../../middleware/errorHandler');
	let currentRole = 'ADMIN';
	let currentUserId = 'ckadmin000000000000000000001';
	const requireAuth = (req: any, _res: any, next: any) => {
		req.user = { id: currentUserId, email: 'a@b.com', role: currentRole };
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
		__setTestAuth: (role: string, uid: string = 'ckadmin000000000000000000001') => { currentRole = role; currentUserId = uid; },
	};
});

jest.mock('@prisma/client', () => {
	const store = {
		project: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		employeeProject: {
			findUnique: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
		},
		user: { findUnique: jest.fn() },
	} as any;
	(global as any).__PRISMA__ = store;
	return {
		PrismaClient: function () { return store; },
		ProjectStatus: { PLANNING: 'PLANNING', IN_PROGRESS: 'IN_PROGRESS' },
		UserRole: { ADMIN: 'ADMIN', MANAGER: 'MANAGER', EMPLOYEE: 'EMPLOYEE' },
	};
});

const getPrisma = () => (global as any).__PRISMA__ as any;

describe('Projects Routes', () => {
	const authMock: any = jest.requireMock('../../middleware/auth');

	beforeEach(() => {
		jest.clearAllMocks();
		authMock.__setTestAuth('ADMIN', 'ckadmin000000000000000000001');
	});

	test('GET /api/projects returns projects for auth user', async () => {
		getPrisma().project.findMany.mockResolvedValueOnce([]);
		const res = await request(app).get('/api/projects');
		expect(res.status).toBe(200);
	});

	test('POST /api/projects requires manager/admin; employee 403', async () => {
		authMock.__setTestAuth('EMPLOYEE', 'ckemployee000000000000000001');
		const res = await request(app)
			.post('/api/projects')
			.send({ name: 'P', managerId: 'ckmanager0000000000000000001', status: 'PLANNING' });
		expect(res.status).toBe(403);
	});

	test('POST /api/projects 201 for admin', async () => {
		getPrisma().user.findUnique.mockResolvedValueOnce({ id: 'ckmanager0000000000000000001', isActive: true });
		getPrisma().project.create.mockResolvedValueOnce({ id: 'ckproject00000000000000001', name: 'P' });
		const res = await request(app)
			.post('/api/projects')
			.send({ name: 'P', managerId: 'ckmanager0000000000000000001', status: 'PLANNING' });
		expect(res.status).toBe(201);
		expect(getPrisma().project.create).toHaveBeenCalled();
	});

	test('DELETE /api/projects/:id admin only; manager 403', async () => {
		authMock.__setTestAuth('MANAGER', 'ckmanager0000000000000000001');
		const res = await request(app).delete('/api/projects/ckproject00000000000000001');
		expect(res.status).toBe(403);
	});

	test('POST /api/projects/:id/assign admin/manager allowed', async () => {
		// Make manager own the project
		getPrisma().project.findUnique.mockResolvedValueOnce({ id: 'ckproject00000000000000001', managerId: 'ckmanager0000000000000000001' });
		getPrisma().user.findUnique.mockResolvedValueOnce({ id: 'ckuser00000000000000000001', isActive: true });
		getPrisma().employeeProject.findUnique.mockResolvedValueOnce(null);
		getPrisma().employeeProject.create.mockResolvedValueOnce({ id: 'ckempprj000000000000000001' });
		authMock.__setTestAuth('MANAGER', 'ckmanager0000000000000000001');
		const res = await request(app).post('/api/projects/ckproject00000000000000001/assign').send({ userId: 'ckuser00000000000000000001' });
		expect(res.status).toBe(201);
	});

	test('DELETE /api/projects/:id/assign/:userId removes assignment for manager', async () => {
		getPrisma().project.findUnique.mockResolvedValueOnce({ id: 'ckproject00000000000000001', managerId: 'ckmanager0000000000000000001' });
		getPrisma().employeeProject.findUnique.mockResolvedValueOnce({ id: 'ckempprj000000000000000001' });
		getPrisma().employeeProject.delete.mockResolvedValueOnce({});
		authMock.__setTestAuth('MANAGER', 'ckmanager0000000000000000001');
		const res = await request(app).delete('/api/projects/ckproject00000000000000001/assign/ckuser00000000000000000001');
		expect(res.status).toBe(200);
	});
});



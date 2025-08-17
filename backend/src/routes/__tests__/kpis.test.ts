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
		kpi: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		kpiValue: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		project: { findUnique: jest.fn() },
	} as any;
	(global as any).__PRISMA__ = store;
	return {
		PrismaClient: function () { return store; },
		KpiType: { NUMERIC: 'NUMERIC', PERCENTAGE: 'PERCENTAGE' },
		UserRole: { ADMIN: 'ADMIN', MANAGER: 'MANAGER', EMPLOYEE: 'EMPLOYEE' },
	};
});

const getPrisma = () => (global as any).__PRISMA__ as any;

describe('KPIs Routes', () => {
	const authMock: any = jest.requireMock('../../middleware/auth');

	beforeEach(() => {
		jest.clearAllMocks();
		authMock.__setTestAuth('ADMIN', 'ckadmin000000000000000000001');
	});

	test('GET /api/kpis returns list', async () => {
		getPrisma().kpi.findMany.mockResolvedValueOnce([]);
		const res = await request(app).get('/api/kpis');
		expect(res.status).toBe(200);
	});

	test('POST /api/kpis requires manager/admin; employee 403', async () => {
		authMock.__setTestAuth('EMPLOYEE', 'ckemployee000000000000000001');
		const res = await request(app)
			.post('/api/kpis')
			.send({ name: 'K', type: 'NUMERIC', isActive: true });
		expect(res.status).toBe(403);
	});

	test('POST /api/kpis 201 for admin', async () => {
		getPrisma().kpi.create.mockResolvedValueOnce({ id: 'ckkpi00000000000000000001', name: 'K' });
		const res = await request(app)
			.post('/api/kpis')
			.send({ name: 'K', type: 'NUMERIC', isActive: true });
		expect(res.status).toBe(201);
	});

	test('GET /api/kpis/:id/values returns values', async () => {
		getPrisma().kpi.findUnique.mockResolvedValueOnce({ id: 'ckkpi00000000000000000001', creatorId: 'ckadmin000000000000000000001', project: null });
		getPrisma().kpiValue.findMany.mockResolvedValueOnce([]);
		const res = await request(app).get('/api/kpis/ckkpi00000000000000000001/values');
		expect(res.status).toBe(200);
	});

	test('PUT /api/kpis/:id/values/:valueId only creator/admin/value owner', async () => {
		getPrisma().kpi.findUnique.mockResolvedValueOnce({ id: 'ckkpi00000000000000000001', creatorId: 'ckadmin000000000000000000001', project: null });
		getPrisma().kpiValue.findUnique.mockResolvedValueOnce({ id: 'ckkpival00000000000000001', userId: 'ckadmin000000000000000000001', kpi: { creatorId: 'ckadmin000000000000000000001', project: null } });
		getPrisma().kpiValue.update.mockResolvedValueOnce({ id: 'ckkpival00000000000000001' });
		const res = await request(app).put('/api/kpis/ckkpi00000000000000000001/values/ckkpival00000000000000001').send({ value: 10 });
		expect(res.status).toBe(200);
	});
});



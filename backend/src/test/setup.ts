import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean up database before tests
  // Commented out to avoid database connection issues during testing
  // await prisma.kpiValue.deleteMany();
  // await prisma.kpi.deleteMany();
  // await prisma.employeeProject.deleteMany();
  // await prisma.project.deleteMany();
  // await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up after each test
  // Commented out to avoid database connection issues during testing
  // await prisma.kpiValue.deleteMany();
  // await prisma.kpi.deleteMany();
  // await prisma.employeeProject.deleteMany();
  // await prisma.project.deleteMany();
  // await prisma.user.deleteMany();
});

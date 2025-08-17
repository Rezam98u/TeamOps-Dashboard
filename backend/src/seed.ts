import { PrismaClient, UserRole, ProjectStatus, KpiType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@teamops.com' },
    update: {},
    create: {
      email: 'admin@teamops.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash('Manager123!', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@teamops.com' },
    update: {},
    create: {
      email: 'manager@teamops.com',
      password: managerPassword,
      firstName: 'John',
      lastName: 'Manager',
      role: UserRole.MANAGER,
    },
  });

  // Create employee user
  const employeePassword = await bcrypt.hash('Employee123!', 12);
  const employee = await prisma.user.upsert({
    where: { email: 'employee@teamops.com' },
    update: {},
    create: {
      email: 'employee@teamops.com',
      password: employeePassword,
      firstName: 'Jane',
      lastName: 'Employee',
      role: UserRole.EMPLOYEE,
    },
  });

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-30'),
      budget: 50000.00,
      managerId: manager.id,
      creatorId: admin.id,
    },
  });

  // Assign employee to project
  await prisma.employeeProject.create({
    data: {
      userId: employee.id,
      projectId: project.id,
      role: 'Frontend Developer',
    },
  });

  // Create sample KPIs
  const kpi1 = await prisma.kpi.create({
    data: {
      name: 'Project Completion',
      description: 'Percentage of project tasks completed',
      type: KpiType.PERCENTAGE,
      target: 100.0,
      unit: '%',
      creatorId: manager.id,
      projectId: project.id,
    },
  });

  const kpi2 = await prisma.kpi.create({
    data: {
      name: 'Budget Utilization',
      description: 'Percentage of budget spent',
      type: KpiType.PERCENTAGE,
      target: 80.0,
      unit: '%',
      creatorId: manager.id,
      projectId: project.id,
    },
  });

  const kpi3 = await prisma.kpi.create({
    data: {
      name: 'Team Satisfaction',
      description: 'Average team satisfaction score',
      type: KpiType.NUMERIC,
      target: 4.5,
      unit: 'score',
      creatorId: manager.id,
    },
  });

  // Create sample KPI values
  await prisma.kpiValue.createMany({
    data: [
      {
        kpiId: kpi1.id,
        userId: manager.id,
        value: 65.0,
        date: new Date('2024-03-15'),
        notes: 'Good progress on frontend development',
      },
      {
        kpiId: kpi1.id,
        userId: manager.id,
        value: 75.0,
        date: new Date('2024-04-01'),
        notes: 'Backend API completed',
      },
      {
        kpiId: kpi2.id,
        userId: manager.id,
        value: 45.0,
        date: new Date('2024-03-15'),
        notes: 'Under budget so far',
      },
      {
        kpiId: kpi3.id,
        userId: employee.id,
        value: 4.2,
        date: new Date('2024-04-01'),
        notes: 'Team is happy with the project direction',
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@teamops.com / Admin123!');
  console.log('👤 Manager user: manager@teamops.com / Manager123!');
  console.log('👤 Employee user: employee@teamops.com / Employee123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

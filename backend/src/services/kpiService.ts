import { PrismaClient, KpiType, UserRole, Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateKpiInput, UpdateKpiInput, CreateKpiValueInput, UpdateKpiValueInput } from '../schemas/kpi';

const prisma = new PrismaClient();

export interface KpiFilters {
  type?: KpiType;
  isActive?: boolean | undefined;
  projectId?: string;
  search?: string;
}

export const getAllKpis = async (filters: KpiFilters = {}, currentUserRole: UserRole, currentUserId: string) => {
  const where: Prisma.KpiWhereInput = {};

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Non-admins can only see KPIs from projects they're involved with
  if (currentUserRole !== 'ADMIN') {
    where.OR = [
      { creatorId: currentUserId },
      { project: { 
        OR: [
          { managerId: currentUserId },
          { creatorId: currentUserId },
          { employees: { some: { userId: currentUserId } } },
        ]
      }},
    ];
  }

  const kpis = await prisma.kpi.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          values: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return kpis;
};

export const getKpiById = async (kpiId: string, currentUserRole: UserRole, currentUserId: string) => {
  const kpi = await prisma.kpi.findUnique({
    where: { id: kpiId },
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          managerId: true,
          creatorId: true,
          employees: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!kpi) {
    throw new AppError('KPI not found', 404);
  }

  // Check permissions
  const isInvolved = 
    currentUserRole === 'ADMIN' ||
    kpi.creatorId === currentUserId ||
    (kpi.project && (
      kpi.project.managerId === currentUserId ||
      kpi.project.creatorId === currentUserId ||
      kpi.project.employees.some(emp => emp.userId === currentUserId)
    ));

  if (!isInvolved) {
    throw new AppError('Insufficient permissions', 403);
  }

  return kpi;
};

export const createKpi = async (input: CreateKpiInput, currentUserId: string, currentUserRole: UserRole) => {
  // Only admins and managers can create KPIs
  if (currentUserRole === 'EMPLOYEE') {
    throw new AppError('Insufficient permissions', 403);
  }

  // If projectId is provided, verify project exists and user has access
  if (input.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: {
        id: true,
        managerId: true,
        creatorId: true,
        employees: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check if user has access to the project
    const hasAccess = 
      currentUserRole === 'ADMIN' ||
      project.managerId === currentUserId ||
      project.creatorId === currentUserId ||
      project.employees.some(emp => emp.userId === currentUserId);

    if (!hasAccess) {
      throw new AppError('Insufficient permissions to create KPI for this project', 403);
    }
  }

  // Create KPI
  const kpi = await prisma.kpi.create({
    data: {
      name: input.name,
      description: input.description || null,
      type: input.type,
      target: input.target || null,
      unit: input.unit || null,
      isActive: input.isActive,
      projectId: input.projectId || null,
      creatorId: currentUserId,
    },
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return kpi;
};

export const updateKpi = async (
  kpiId: string,
  input: UpdateKpiInput,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  // Get KPI with project info
  const kpi = await prisma.kpi.findUnique({
    where: { id: kpiId },
    include: {
      project: {
        select: {
          id: true,
          managerId: true,
          creatorId: true,
          employees: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!kpi) {
    throw new AppError('KPI not found', 404);
  }

  // Check permissions: only admins, KPI creator, or project managers can update
  const canUpdate = 
    currentUserRole === 'ADMIN' ||
    kpi.creatorId === currentUserId ||
    (kpi.project && (
      kpi.project.managerId === currentUserId ||
      kpi.project.creatorId === currentUserId
    ));

  if (!canUpdate) {
    throw new AppError('Insufficient permissions', 403);
  }

  // If projectId is being changed, verify new project exists and user has access
  if (input.projectId && input.projectId !== kpi.projectId) {
    const newProject = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: {
        id: true,
        managerId: true,
        creatorId: true,
        employees: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!newProject) {
      throw new AppError('Project not found', 404);
    }

    const hasAccess = 
      currentUserRole === 'ADMIN' ||
      newProject.managerId === currentUserId ||
      newProject.creatorId === currentUserId ||
      newProject.employees.some(emp => emp.userId === currentUserId);

    if (!hasAccess) {
      throw new AppError('Insufficient permissions to assign KPI to this project', 403);
    }
  }

  // Filter out undefined values
  const updateData: Record<string, unknown> = {};
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  // Update KPI
  const updatedKpi = await prisma.kpi.update({
    where: { id: kpiId },
    data: updateData,
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return updatedKpi;
};

export const deleteKpi = async (kpiId: string, currentUserId: string, currentUserRole: UserRole) => {
  // Get KPI with project info
  const kpi = await prisma.kpi.findUnique({
    where: { id: kpiId },
    include: {
      project: {
        select: {
          id: true,
          managerId: true,
          creatorId: true,
        },
      },
    },
  });

  if (!kpi) {
    throw new AppError('KPI not found', 404);
  }

  // Check permissions: only admins, KPI creator, or project managers can delete
  const canDelete = 
    currentUserRole === 'ADMIN' ||
    kpi.creatorId === currentUserId ||
    (kpi.project && (
      kpi.project.managerId === currentUserId ||
      kpi.project.creatorId === currentUserId
    ));

  if (!canDelete) {
    throw new AppError('Insufficient permissions', 403);
  }

  // Delete KPI (this will cascade to KPI values)
  await prisma.kpi.delete({
    where: { id: kpiId },
  });

  return { message: 'KPI deleted successfully' };
};

export const getKpiValues = async (kpiId: string, currentUserRole: UserRole, currentUserId: string) => {
  // First verify KPI exists and user has access
  await getKpiById(kpiId, currentUserRole, currentUserId);

  const values = await prisma.kpiValue.findMany({
    where: { kpiId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  return values;
};

export const createKpiValue = async (
  kpiId: string,
  input: CreateKpiValueInput,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  // First verify KPI exists and user has access
  await getKpiById(kpiId, currentUserRole, currentUserId);

  // Create KPI value
  const kpiValue = await prisma.kpiValue.create({
    data: {
      kpiId: kpiId,
      value: input.value,
      date: input.date ? new Date(input.date) : new Date(),
      notes: input.notes || null,
      userId: currentUserId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return kpiValue;
};

export const updateKpiValue = async (
  kpiId: string,
  valueId: string,
  input: UpdateKpiValueInput,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  // First verify KPI exists and user has access
  await getKpiById(kpiId, currentUserRole, currentUserId);

  // Get KPI value
  const kpiValue = await prisma.kpiValue.findUnique({
    where: { id: valueId },
    include: {
      kpi: {
        select: {
          creatorId: true,
          project: {
            select: {
              managerId: true,
              creatorId: true,
            },
          },
        },
      },
    },
  });

  if (!kpiValue) {
    throw new AppError('KPI value not found', 404);
  }

  // Check permissions: only admins, KPI creator, project managers, or value creator can update
  const canUpdate = 
    currentUserRole === 'ADMIN' ||
    kpiValue.kpi.creatorId === currentUserId ||
    kpiValue.userId === currentUserId ||
    (kpiValue.kpi.project && (
      kpiValue.kpi.project.managerId === currentUserId ||
      kpiValue.kpi.project.creatorId === currentUserId
    ));

  if (!canUpdate) {
    throw new AppError('Insufficient permissions', 403);
  }

  // Filter out undefined values
  const updateData: Record<string, unknown> = {};
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'date') {
        updateData[key] = value ? new Date(value) : undefined;
      } else {
        updateData[key] = value;
      }
    }
  });

  // Update KPI value
  const updatedValue = await prisma.kpiValue.update({
    where: { id: valueId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return updatedValue;
};

export const deleteKpiValue = async (
  kpiId: string,
  valueId: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  // First verify KPI exists and user has access
  await getKpiById(kpiId, currentUserRole, currentUserId);

  // Get KPI value
  const kpiValue = await prisma.kpiValue.findUnique({
    where: { id: valueId },
    include: {
      kpi: {
        select: {
          creatorId: true,
          project: {
            select: {
              managerId: true,
              creatorId: true,
            },
          },
        },
      },
    },
  });

  if (!kpiValue) {
    throw new AppError('KPI value not found', 404);
  }

  // Check permissions: only admins, KPI creator, project managers, or value creator can delete
  const canDelete = 
    currentUserRole === 'ADMIN' ||
    kpiValue.kpi.creatorId === currentUserId ||
    kpiValue.userId === currentUserId ||
    (kpiValue.kpi.project && (
      kpiValue.kpi.project.managerId === currentUserId ||
      kpiValue.kpi.project.creatorId === currentUserId
    ));

  if (!canDelete) {
    throw new AppError('Insufficient permissions', 403);
  }

  // Delete KPI value
  await prisma.kpiValue.delete({
    where: { id: valueId },
  });

  return { message: 'KPI value deleted successfully' };
};

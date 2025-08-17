import { PrismaClient, ProjectStatus, UserRole } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateProjectInput, UpdateProjectInput, AssignEmployeeInput } from '../schemas/project';

const prisma = new PrismaClient();

export interface ProjectFilters {
  status?: ProjectStatus;
  managerId?: string;
  search?: string;
}

export const getAllProjects = async (filters: ProjectFilters = {}, currentUserRole: UserRole, currentUserId: string) => {
  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.managerId) {
    where.managerId = filters.managerId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Non-admins can only see projects they're involved with
  if (currentUserRole !== 'ADMIN') {
    where.OR = [
      { managerId: currentUserId },
      { creatorId: currentUserId },
      { employees: { some: { userId: currentUserId } } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      employees: {
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
      },
      _count: {
        select: {
          employees: true,
          kpis: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return projects;
};

export const getProjectById = async (projectId: string, currentUserRole: UserRole, currentUserId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      employees: {
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
      },
      kpis: {
        select: {
          id: true,
          name: true,
          type: true,
          target: true,
          unit: true,
          isActive: true,
        },
      },
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Check permissions
  const isInvolved = 
    currentUserRole === 'ADMIN' ||
    project.managerId === currentUserId ||
    project.creatorId === currentUserId ||
    project.employees.some(emp => emp.userId === currentUserId);

  if (!isInvolved) {
    throw new AppError('Insufficient permissions', 403);
  }

  return project;
};

export const createProject = async (input: CreateProjectInput, currentUserId: string, currentUserRole: UserRole) => {
  // Only admins and managers can create projects
  if (currentUserRole === 'EMPLOYEE') {
    throw new AppError('Insufficient permissions', 403);
  }

  // Verify manager exists and is active
  const manager = await prisma.user.findUnique({
    where: { id: input.managerId },
    select: { id: true, isActive: true },
  });

  if (!manager || !manager.isActive) {
    throw new AppError('Manager not found or inactive', 400);
  }

  // Create project
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description || null,
      status: input.status,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      budget: input.budget || null,
      managerId: input.managerId,
      creatorId: currentUserId,
    },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return project;
};

export const updateProject = async (
  projectId: string,
  input: UpdateProjectInput,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  // Get project with manager info
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      managerId: true,
      creatorId: true,
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Check permissions: only admins, managers, or project creator can update
  const canUpdate = 
    currentUserRole === 'ADMIN' ||
    project.managerId === currentUserId ||
    project.creatorId === currentUserId;

  if (!canUpdate) {
    throw new AppError('Insufficient permissions', 403);
  }

  // Verify new manager exists and is active (if being changed)
  if (input.managerId && input.managerId !== project.managerId) {
    const newManager = await prisma.user.findUnique({
      where: { id: input.managerId },
      select: { id: true, isActive: true },
    });

    if (!newManager || !newManager.isActive) {
      throw new AppError('Manager not found or inactive', 400);
    }
  }

  // Filter out undefined values
  const updateData: Record<string, unknown> = {};
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'startDate' || key === 'endDate') {
        updateData[key] = value ? new Date(value) : null;
      } else {
        updateData[key] = value;
      }
    }
  });

  // Update project
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return updatedProject;
};

export const deleteProject = async (projectId: string, _currentUserId: string, currentUserRole: UserRole) => {
  // Only admins can delete projects
  if (currentUserRole !== 'ADMIN') {
    throw new AppError('Insufficient permissions', 403);
  }

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Delete project (this will cascade to related records)
  await prisma.project.delete({
    where: { id: projectId },
  });

  return { message: 'Project deleted successfully' };
};

export const assignEmployeeToProject = async (
  projectId: string,
  input: AssignEmployeeInput,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  // Get project with manager info
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      managerId: true,
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Check permissions: only admins or project managers can assign employees
  const canAssign = currentUserRole === 'ADMIN' || project.managerId === currentUserId;
  if (!canAssign) {
    throw new AppError('Insufficient permissions', 403);
  }

  // Verify employee exists and is active
  const employee = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, isActive: true },
  });

  if (!employee || !employee.isActive) {
    throw new AppError('Employee not found or inactive', 400);
  }

  // Check if already assigned
  const existingAssignment = await prisma.employeeProject.findUnique({
    where: {
      userId_projectId: {
        userId: input.userId,
        projectId: projectId,
      },
    },
  });

  if (existingAssignment) {
    throw new AppError('Employee is already assigned to this project', 409);
  }

  // Assign employee
  const assignment = await prisma.employeeProject.create({
    data: {
      userId: input.userId,
      projectId: projectId,
      role: input.role || null,
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      endDate: input.endDate ? new Date(input.endDate) : null,
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

  return assignment;
};

export const removeEmployeeFromProject = async (
  projectId: string,
  userId: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  // Get project with manager info
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      managerId: true,
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Check permissions: only admins or project managers can remove employees
  const canRemove = currentUserRole === 'ADMIN' || project.managerId === currentUserId;
  if (!canRemove) {
    throw new AppError('Insufficient permissions', 403);
  }

  // Check if assignment exists
  const assignment = await prisma.employeeProject.findUnique({
    where: {
      userId_projectId: {
        userId: userId,
        projectId: projectId,
      },
    },
  });

  if (!assignment) {
    throw new AppError('Employee is not assigned to this project', 404);
  }

  // Remove assignment
  await prisma.employeeProject.delete({
    where: {
      userId_projectId: {
        userId: userId,
        projectId: projectId,
      },
    },
  });

  return { message: 'Employee removed from project successfully' };
};

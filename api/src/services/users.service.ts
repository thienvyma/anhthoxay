/**
 * Users Service
 * 
 * Business logic for user management (ADMIN only)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from '../schemas/users.schema';

export class UsersService {
  constructor(private prisma: PrismaClient) {}

  /**
   * List users with pagination and filtering
   */
  async list(query: ListUsersQuery) {
    const { search, role, page, limit } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    
    if (role) {
      where.role = role;
    }

    // Note: status field doesn't exist in current schema
    // Will filter in memory for now, or add to schema later
    // For now, we'll skip status filtering

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              sessions: true,
              blogPosts: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: true,
            blogPosts: true,
          },
        },
      },
    });
  }

  /**
   * Create new user (Admin only)
   */
  async create(data: CreateUserInput) {
    // Check if email exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update user (Admin only)
   */
  async update(id: string, data: UpdateUserInput) {
    // Check user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    
    // Handle password change
    if (data.password && data.password.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete user (Admin only)
   * Cannot delete self
   */
  async delete(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new Error('CANNOT_DELETE_SELF');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Delete all sessions first
    await this.prisma.session.deleteMany({ where: { userId: id } });

    // Delete user
    await this.prisma.user.delete({ where: { id } });

    return { ok: true };
  }

  /**
   * Ban user - revoke all sessions
   */
  async banUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new Error('CANNOT_BAN_SELF');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Revoke all sessions
    const result = await this.prisma.session.deleteMany({
      where: { userId: id },
    });

    return { 
      ok: true, 
      sessionsRevoked: result.count,
      message: `User banned. ${result.count} sessions revoked.`,
    };
  }

  /**
   * Get user sessions (for admin to view)
   */
  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke specific user session
   */
  async revokeUserSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    await this.prisma.session.delete({ where: { id: sessionId } });

    return { ok: true };
  }
}

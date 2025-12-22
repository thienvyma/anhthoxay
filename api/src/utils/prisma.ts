import { PrismaClient } from '@prisma/client';

// Global prisma instance for use across services
export const prisma = new PrismaClient();

// Export type for use in services
export type { PrismaClient };

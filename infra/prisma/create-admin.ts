/**
 * Create Admin User Script
 * Run this before seeding if no admin user exists
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creating admin user...');

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', existingAdmin.email);
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@anhthoxay.vn',
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
      phone: '0900000000',
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('   Password: Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');

async function checkAdmin() {
  const prisma = new PrismaClient();
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    console.log('Current admin accounts:');
    console.log('Count:', admins.length);
    admins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.email}) - Created: ${admin.createdAt}`);
    });
  } catch (error) {
    console.error('Error checking admin accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();

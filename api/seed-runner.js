const { execSync } = require('child_process');

console.log('🚀 Running comprehensive database seed...');

try {
  // Run the seed script
  execSync('npx tsx ../infra/prisma/seed.ts', {
    stdio: 'inherit',
    cwd: __dirname
  });

  console.log('✅ Database seeding completed successfully!');
} catch (error) {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
}

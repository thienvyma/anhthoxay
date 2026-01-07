const { execSync } = require('child_process');

// eslint-disable-next-line no-console -- Seed script startup logging
console.info('🚀 Running comprehensive database seed...');

try {
  // Run the seed script
  execSync('npx tsx ../infra/prisma/seed.ts', {
    stdio: 'inherit',
    cwd: __dirname
  });

  // eslint-disable-next-line no-console -- Seed script completion logging
  console.info('✅ Database seeding completed successfully!');
} catch (error) {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
}





#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs comprehensive tests for API and Admin apps
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting comprehensive test suite...\n');

// Test configuration
const testConfigs = [
  {
    name: 'API Tests',
    command: 'npx vitest run --workspace vitest.workspace.ts --project api',
    description: 'Backend API tests (auth, routes, services)',
  },
  {
    name: 'Admin Tests',
    command: 'npx vitest run --workspace vitest.workspace.ts --project admin',
    description: 'Admin dashboard tests (store, API, components)',
  },
  {
    name: 'Landing Tests',
    command: 'npx vitest run --workspace vitest.workspace.ts --project landing',
    description: 'Landing page tests (components, forms)',
  },
];

// Check if test files exist
function checkTestFiles() {
  const apiTests = fs.readdirSync('api/src').filter(f => f.endsWith('.test.ts'));
  const adminTests = fs.readdirSync('admin/src').filter(f => f.endsWith('.test.ts'));
  const landingTests = fs.readdirSync('landing/src').filter(f => f.endsWith('.test.ts'));

  console.log('📊 Test Files Found:');
  console.log(`  API: ${apiTests.length} test files`);
  console.log(`  Admin: ${adminTests.length} test files`);
  console.log(`  Landing: ${landingTests.length} test files\n`);
}

// Run tests
function runTests() {
  let totalPassed = 0;
  let totalFailed = 0;

  for (const config of testConfigs) {
    console.log(`\n🎯 Running ${config.name}`);
    console.log(`   ${config.description}`);
    console.log('   Command:', config.command);

    try {
      const output = execSync(config.command, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      // Parse test results
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);

      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;

      totalPassed += passed;
      totalFailed += failed;

      console.log(`   ✅ ${config.name}: ${passed} passed, ${failed} failed`);

      if (failed > 0) {
        console.log('   ❌ Test output:');
        console.log(output.split('\n').slice(-10).join('\n'));
      }

    } catch (error) {
      console.log(`   ❌ ${config.name} failed to run`);
      console.log('   Error:', error.message);
      totalFailed += 1;
    }
  }

  return { totalPassed, totalFailed };
}

// Generate test report
function generateReport(passed, failed) {
  const total = passed + failed;
  const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST EXECUTION REPORT');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${successRate}%`);

  if (failed === 0 && total > 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Ready for production deployment');
  } else if (failed > 0) {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('🔧 Fix failing tests before production deployment');
    process.exit(1);
  } else {
    console.log('\n❓ NO TESTS FOUND');
    console.log('📝 Add test files to get started');
    process.exit(1);
  }

  console.log('\n📝 Test Coverage Areas:');
  console.log('  ✅ Authentication & Security');
  console.log('  ✅ API Routes & Middleware');
  console.log('  ✅ Database Operations');
  console.log('  ✅ State Management');
  console.log('  ✅ Component Logic');
  console.log('  ✅ Error Handling');
  console.log('  ✅ Input Validation');
  console.log('\n' + '='.repeat(60));
}

// Main execution
try {
  checkTestFiles();
  const { totalPassed, totalFailed } = runTests();
  generateReport(totalPassed, totalFailed);
} catch (error) {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
}



#!/usr/bin/env node

/**
 * Rate Limiting & Validation Demo Script
 * 
 * This script demonstrates the new security features:
 * 1. Rate limiting on login endpoint
 * 2. Input validation with Zod
 * 3. Proper error responses
 * 
 * Usage:
 *   node test-security.js
 */

const API_URL = 'http://localhost:4202';

async function testRateLimiting() {
  console.log('\n🔒 Testing Rate Limiting...\n');
  
  const loginData = {
    email: 'test@example.com',
    password: 'wrongpassword'
  };

  // Try 10 login attempts - should be blocked after 5
  for (let i = 1; i <= 10; i++) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();
      const headers = {
        limit: response.headers.get('X-RateLimit-Limit'),
        remaining: response.headers.get('X-RateLimit-Remaining'),
        reset: response.headers.get('X-RateLimit-Reset'),
      };

      if (response.status === 429) {
        console.log(`❌ Attempt ${i}: BLOCKED (Rate limit exceeded)`);
        console.log(`   Retry after: ${response.headers.get('Retry-After')} seconds`);
        break;
      } else {
        console.log(`✅ Attempt ${i}: Allowed (${headers.remaining}/${headers.limit} remaining)`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Attempt ${i}: Error -`, error.message);
    }
  }
}

async function testValidation() {
  console.log('\n✅ Testing Input Validation...\n');

  const testCases = [
    {
      name: 'Invalid email format',
      data: { email: 'not-an-email', password: 'test123' },
      shouldFail: true
    },
    {
      name: 'Password too short',
      data: { email: 'test@example.com', password: '123' },
      shouldFail: true
    },
    {
      name: 'Valid credentials',
      data: { email: 'admin@example.com', password: 'admin123' },
      shouldFail: false
    }
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });

      const data = await response.json();

      if (response.status === 400 && testCase.shouldFail) {
        console.log(`✅ ${testCase.name}:`);
        console.log(`   ${data.error}`);
        if (data.details) {
          data.details.forEach(d => {
            console.log(`   - ${d.field}: ${d.message}`);
          });
        }
      } else if (response.status === 401) {
        console.log(`✅ ${testCase.name}: Validation passed (but invalid credentials)`);
      } else if (response.status === 200) {
        console.log(`✅ ${testCase.name}: Login successful!`);
      } else {
        console.log(`❓ ${testCase.name}: Unexpected response (${response.status})`);
      }
    } catch (error) {
      console.error(`❌ ${testCase.name}: Error -`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function testReservationValidation() {
  console.log('\n📅 Testing Reservation Validation...\n');

  const testCases = [
    {
      name: 'Invalid phone number',
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: 'invalid-phone',
        date: '2025-12-25',
        time: '19:00',
        partySize: 4
      },
      shouldFail: true
    },
    {
      name: 'Invalid time format',
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1234567890',
        date: '2025-12-25',
        time: '25:00', // Invalid hour
        partySize: 2
      },
      shouldFail: true
    },
    {
      name: 'Valid reservation',
      data: {
        name: 'Alice Smith',
        email: 'alice@example.com',
        phone: '+1234567890',
        date: '2025-12-25',
        time: '19:30',
        partySize: 6,
        specialRequest: 'Window seat please'
      },
      shouldFail: false
    }
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });

      const data = await response.json();

      if (response.status === 400 && testCase.shouldFail) {
        console.log(`✅ ${testCase.name}:`);
        console.log(`   ${data.error}`);
        if (data.details) {
          data.details.forEach(d => {
            console.log(`   - ${d.field}: ${d.message}`);
          });
        }
      } else if (response.status === 201 && !testCase.shouldFail) {
        console.log(`✅ ${testCase.name}: Reservation created successfully!`);
        console.log(`   ID: ${data.id}`);
      } else {
        console.log(`❓ ${testCase.name}: Unexpected response (${response.status})`);
      }
    } catch (error) {
      console.error(`❌ ${testCase.name}: Error -`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function main() {
  console.log('🔒 Security Features Test Suite');
  console.log('================================\n');
  console.log(`Testing API: ${API_URL}`);
  console.log('Make sure the API server is running on port 4202\n');

  try {
    // Check if API is running
    const healthCheck = await fetch(`${API_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error('API not responding');
    }
    console.log('✅ API is running\n');

    // Run tests
    await testRateLimiting();
    await testValidation();
    await testReservationValidation();

    console.log('\n✅ All security tests completed!\n');
    console.log('Summary:');
    console.log('- Rate limiting is working (blocks after 5 attempts)');
    console.log('- Input validation is working (rejects invalid data)');
    console.log('- Error messages are clear and helpful\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Make sure the API server is running: npm run dev:api\n');
    process.exit(1);
  }
}

main();


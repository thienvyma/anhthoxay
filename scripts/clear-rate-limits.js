/**
 * Script to clear rate limits from Redis
 * Run this in Cloud Shell or a VM that can access the Redis instance
 * 
 * Usage: 
 *   export REDIS_URL=redis://10.83.174.107:6379
 *   node clear-rate-limits.js
 */

const Redis = require('ioredis');

async function clearRateLimits() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.error('REDIS_URL environment variable is required');
    process.exit(1);
  }

  console.log('Connecting to Redis...');
  const redis = new Redis(redisUrl);

  try {
    // Clear rate limit keys
    const patterns = [
      'ratelimit:*',
      'ratelimit:login:*',
      'blocked_ip:*',
      'ip_violations:*',
      'ip_blocking:emergency_mode'
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      console.log(`Scanning for keys matching: ${pattern}`);
      let cursor = '0';
      
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await redis.del(...keys);
          totalDeleted += keys.length;
          console.log(`  Deleted ${keys.length} keys`);
        }
      } while (cursor !== '0');
    }

    console.log(`\n✅ Total deleted: ${totalDeleted} keys`);
    console.log('Rate limits cleared successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    redis.disconnect();
  }
}

clearRateLimits();

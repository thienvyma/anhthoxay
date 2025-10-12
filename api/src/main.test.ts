import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Basic API tests
describe('API Core Functionality', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
      const bcrypt = await import('bcrypt');
      const password = 'test123456';
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should verify correct password', async () => {
      const bcrypt = await import('bcrypt');
      const password = 'test123456';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const bcrypt = await import('bcrypt');
      const password = 'test123456';
      const wrongPassword = 'wrongpassword';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Token Generation', () => {
    it('should generate unique session tokens', () => {
      const token1 = crypto.randomBytes(24).toString('hex');
      const token2 = crypto.randomBytes(24).toString('hex');
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(48); // 24 bytes = 48 hex chars
    });

    it('should generate unique UUIDs for resources', () => {
      const id1 = crypto.randomUUID();
      const id2 = crypto.randomUUID();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('Database Connection', () => {
    it.skipIf(!process.env.DATABASE_URL)('should connect to database', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    it.skipIf(!process.env.DATABASE_URL)('should query database', async () => {
      const users = await prisma.user.findMany({ take: 1 });
      expect(Array.isArray(users)).toBe(true);
    });
  });
});

describe('Validation Schemas', () => {
  it('should validate login schema', async () => {
    const { loginSchema } = await import('./schemas');
    
    const validData = {
      email: 'test@example.com',
      password: 'password123',
    };
    
    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', async () => {
    const { loginSchema } = await import('./schemas');
    
    const invalidData = {
      email: 'not-an-email',
      password: 'password123',
    };
    
    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject short password', async () => {
    const { loginSchema } = await import('./schemas');
    
    const invalidData = {
      email: 'test@example.com',
      password: '12345', // Too short
    };
    
    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should validate reservation schema', async () => {
    const { createReservationSchema } = await import('./schemas');
    
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      date: '2025-12-25',
      time: '19:00',
      partySize: 4,
      specialRequest: 'Window seat please',
    };
    
    const result = createReservationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid phone number', async () => {
    const { createReservationSchema } = await import('./schemas');
    
    const invalidData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: 'invalid-phone',
      date: '2025-12-25',
      time: '19:00',
      partySize: 4,
    };
    
    const result = createReservationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid time format', async () => {
    const { createReservationSchema } = await import('./schemas');
    
    const invalidData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      date: '2025-12-25',
      time: '25:00', // Invalid hour
      partySize: 4,
    };
    
    const result = createReservationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Rate Limiting', () => {
  it('should have rate limit store', async () => {
    const { rateLimit } = await import('./middleware');
    expect(rateLimit).toBeDefined();
    expect(typeof rateLimit).toBe('function');
  });

  it('should create rate limit middleware with options', async () => {
    const { rateLimit } = await import('./middleware');
    
    const middleware = rateLimit({
      windowMs: 60000,
      max: 10,
    });
    
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('function');
  });
});

describe('Middleware Functions', () => {
  it('should have validate middleware', async () => {
    const { validate } = await import('./middleware');
    expect(validate).toBeDefined();
    expect(typeof validate).toBe('function');
  });

  it('should have sanitizeString function', async () => {
    const { sanitizeString } = await import('./middleware');
    
    const cleaned = sanitizeString('<script>alert("xss")</script>');
    expect(cleaned).not.toContain('<');
    expect(cleaned).not.toContain('>');
  });

  it('should sanitize object recursively', async () => {
    const { sanitizeObject } = await import('./middleware');
    
    const dirty = {
      name: '<script>alert("xss")</script>',
      nested: {
        value: '<b>bold</b>',
      },
    };
    
    const clean = sanitizeObject(dirty);
    expect(clean.name).not.toContain('<');
    expect(clean.nested.value).not.toContain('<');
  });
});


/**
 * Environment Validation
 *
 * Validates required environment variables at startup.
 * Ensures critical security settings are properly configured.
 *
 * **Feature: production-readiness**
 * **Requirements: FR-2.3**
 */

import { z } from 'zod';

/**
 * Environment schema for validation
 * Required variables must be present in production
 * Optional variables have defaults or are only needed for specific features
 */
const envSchema = z.object({
  // Required in all environments
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Firebase configuration (required for Firestore mode)
  FIREBASE_PROJECT_ID: z.string().optional(),
  
  // Optional - Legacy Prisma/PostgreSQL (not used in Firestore mode)
  DATABASE_URL: z.string().optional(),
  
  // Required in production
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  
  // Optional - Redis for caching/rate limiting
  REDIS_URL: z.string().optional(),
  
  // Optional - CORS configuration
  CORS_ORIGINS: z.string().optional(),
  
  // Optional - Server configuration
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').optional(),
  
  // Optional - Encryption key for sensitive data
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),
  
  // Optional - Google OAuth for integrations
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  
  // Optional - Sentry error tracking
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables at startup
 * 
 * @returns Validated environment configuration
 * @throws Exits process with code 1 if validation fails in production
 * 
 * @example
 * ```ts
 * // In main.ts
 * import { validateEnvironment } from './config/env-validation';
 * 
 * const env = validateEnvironment();
 * // Use env.DATABASE_URL, env.JWT_SECRET, etc.
 * ```
 */
export function validateEnvironment(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!result.success) {
    const errors = result.error.format();
    
    console.error('❌ Invalid environment variables:');
    
    // Log each error
    Object.entries(errors).forEach(([key, value]) => {
      if (key !== '_errors' && typeof value === 'object' && '_errors' in value) {
        const errorMessages = (value as { _errors: string[] })._errors;
        if (errorMessages.length > 0) {
          console.error(`   ${key}: ${errorMessages.join(', ')}`);
        }
      }
    });
    
    if (isProduction) {
      console.error('\n❌ FATAL: Environment validation failed in production mode');
      process.exit(1);
    } else {
      console.warn('\n⚠️ WARNING: Environment validation failed. Some features may not work correctly.');
    }
  }
  
  // Additional production-specific validations
  if (isProduction) {
    if (!process.env.JWT_SECRET) {
      console.error('❌ FATAL: JWT_SECRET is required in production mode');
      process.exit(1);
    }
    
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      console.error('❌ FATAL: JWT_SECRET must be at least 32 characters in production mode');
      process.exit(1);
    }
  }
  
  return result.success ? result.data : (process.env as unknown as EnvConfig);
}

/**
 * Get validated environment config
 * Call this after validateEnvironment() has been called
 */
let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    cachedEnv = validateEnvironment();
  }
  return cachedEnv;
}

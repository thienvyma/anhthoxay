/**
 * Property-Based Tests for CORS Configuration
 * 
 * **Feature: api-refactoring**
 * **Property 6: CORS Origins From Environment**
 * **Property 7: CORS Origin Validation**
 * **Validates: Requirements 4.1, 4.2, 4.5**
 */

import * as fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ============================================
// Type Definitions (isolated for testing)
// ============================================

interface CorsConfig {
  origins: string[];
  isProduction: boolean;
}

class CorsValidationError extends Error {
  constructor(
    message: string,
    public readonly invalidOrigin: string
  ) {
    super(message);
    this.name = 'CorsValidationError';
  }
}

// ============================================
// CORS Logic (isolated for testing)
// ============================================

const DEFAULT_DEV_ORIGINS = ['http://localhost:4200', 'http://localhost:4201'];

function isValidOrigin(origin: string): boolean {
  if (!origin || typeof origin !== 'string') {
    return false;
  }
  
  try {
    const url = new URL(origin);
    
    // Only allow HTTP and HTTPS protocols for CORS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    
    const reconstructed = `${url.protocol}//${url.host}`;
    return reconstructed === origin;
  } catch {
    return false;
  }
}

function parseOrigins(originsString: string): string[] {
  if (!originsString || typeof originsString !== 'string') {
    return [];
  }
  
  return originsString
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

function validateOrigins(origins: string[]): void {
  for (const origin of origins) {
    if (!isValidOrigin(origin)) {
      throw new CorsValidationError(
        `Invalid CORS origin: ${origin}`,
        origin
      );
    }
  }
}

function getCorsConfigFromEnv(
  corsOriginsEnv: string | undefined,
  nodeEnv: string | undefined
): CorsConfig {
  const isProduction = nodeEnv === 'production';
  
  if (corsOriginsEnv) {
    const origins = parseOrigins(corsOriginsEnv);
    validateOrigins(origins);
    return { origins, isProduction };
  }
  
  if (isProduction) {
    return { origins: [], isProduction };
  }
  
  return {
    origins: DEFAULT_DEV_ORIGINS,
    isProduction: false,
  };
}

// ============================================
// Generators
// ============================================

// Generate valid protocol
const validProtocol = fc.constantFrom('http', 'https');

// Generate valid hostname
const validHostname = fc.oneof(
  fc.constant('localhost'),
  fc.constant('127.0.0.1'),
  // Domain names
  fc.tuple(
    fc.stringMatching(/^[a-z0-9]{1,10}$/),
    fc.constantFrom('.com', '.org', '.net', '.io', '.dev')
  ).map(([name, tld]) => `${name}${tld}`),
  // Subdomains
  fc.tuple(
    fc.stringMatching(/^[a-z]{1,5}$/),
    fc.stringMatching(/^[a-z0-9]{1,8}$/),
    fc.constantFrom('.com', '.org', '.net')
  ).map(([sub, name, tld]) => `${sub}.${name}${tld}`)
);

// Generate valid port (optional)
// Note: We exclude default ports (80 for HTTP, 443 for HTTPS) because
// the URL parser normalizes them away, causing validation to fail
// e.g., "https://example.com:443" becomes "https://example.com" after parsing
const validPort = fc.oneof(
  fc.constant(''),
  // Use non-default ports to avoid normalization issues
  fc.integer({ min: 1024, max: 65535 }).map(p => `:${p}`)
);

// Generate a valid origin URL
const validOriginUrl = fc.tuple(validProtocol, validHostname, validPort)
  .map(([protocol, hostname, port]) => `${protocol}://${hostname}${port}`);

// Generate invalid origins
const invalidOrigin = fc.oneof(
  // Empty or whitespace
  fc.constant(''),
  fc.stringMatching(/^ {1,5}$/),
  // Missing protocol
  fc.constant('localhost:4200'),
  fc.constant('example.com'),
  // Invalid protocol
  fc.constant('ftp://example.com'),
  fc.constant('file:///path'),
  // With path (invalid for origin)
  fc.constant('http://localhost:4200/path'),
  fc.constant('https://example.com/api'),
  // With query string
  fc.constant('http://localhost:4200?query=1'),
  // With fragment
  fc.constant('http://localhost:4200#hash'),
  // Random garbage
  fc.stringMatching(/^[!@#$%^&*()]{1,10}$/),
  // Just protocol
  fc.constant('http://'),
  fc.constant('https://')
);

// ============================================
// PROPERTY 6: CORS Origins From Environment
// Requirements: 4.1, 4.2
// ============================================

describe('Property 6: CORS Origins From Environment', () => {
  
  describe('parseOrigins', () => {
    it('should parse comma-separated origins correctly', () => {
      fc.assert(
        fc.property(
          fc.array(validOriginUrl, { minLength: 1, maxLength: 5 }),
          (origins) => {
            const originsString = origins.join(',');
            const parsed = parseOrigins(originsString);
            
            // Should have same number of origins
            return parsed.length === origins.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trim whitespace from origins', () => {
      fc.assert(
        fc.property(
          fc.array(validOriginUrl, { minLength: 1, maxLength: 3 }),
          fc.array(fc.stringMatching(/^ {0,3}$/), { minLength: 1, maxLength: 3 }),
          (origins, spaces) => {
            // Add random whitespace around origins
            const withSpaces = origins.map((o, i) => {
              const space = spaces[i % spaces.length] || '';
              return `${space}${o}${space}`;
            });
            const originsString = withSpaces.join(',');
            const parsed = parseOrigins(originsString);
            
            // All parsed origins should be trimmed
            return parsed.every(o => o === o.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter out empty strings', () => {
      fc.assert(
        fc.property(
          fc.array(validOriginUrl, { minLength: 1, maxLength: 3 }),
          (origins) => {
            // Add empty entries
            const withEmpty = [...origins, '', '  ', ''];
            const originsString = withEmpty.join(',');
            const parsed = parseOrigins(originsString);
            
            // Should not contain empty strings
            return parsed.every(o => o.length > 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for empty input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', null, undefined),
          (input) => {
            const parsed = parseOrigins(input as string);
            return parsed.length === 0;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should preserve origin order', () => {
      fc.assert(
        fc.property(
          fc.array(validOriginUrl, { minLength: 2, maxLength: 5 }),
          (origins) => {
            const originsString = origins.join(',');
            const parsed = parseOrigins(originsString);
            
            // Order should be preserved
            return origins.every((o, i) => parsed[i] === o);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getCorsConfig with CORS_ORIGINS set', () => {
    it('should use origins from environment variable', () => {
      fc.assert(
        fc.property(
          fc.array(validOriginUrl, { minLength: 1, maxLength: 5 }),
          fc.constantFrom('development', 'production', 'test'),
          (origins, nodeEnv) => {
            const originsString = origins.join(',');
            const config = getCorsConfigFromEnv(originsString, nodeEnv);
            
            // Should have the same origins
            return (
              config.origins.length === origins.length &&
              origins.every(o => config.origins.includes(o))
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set isProduction correctly based on NODE_ENV', () => {
      fc.assert(
        fc.property(
          fc.array(validOriginUrl, { minLength: 1, maxLength: 3 }),
          fc.constantFrom('development', 'production', 'test', undefined),
          (origins, nodeEnv) => {
            const originsString = origins.join(',');
            const config = getCorsConfigFromEnv(originsString, nodeEnv);
            
            return config.isProduction === (nodeEnv === 'production');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getCorsConfig fallback behavior', () => {
    it('should use default dev origins when CORS_ORIGINS not set in development', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('development', 'test', undefined, ''),
          (nodeEnv) => {
            const config = getCorsConfigFromEnv(undefined, nodeEnv);
            
            return (
              config.origins.length === DEFAULT_DEV_ORIGINS.length &&
              DEFAULT_DEV_ORIGINS.every(o => config.origins.includes(o))
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should use empty origins when CORS_ORIGINS not set in production', () => {
      const config = getCorsConfigFromEnv(undefined, 'production');
      
      expect(config.origins).toEqual([]);
      expect(config.isProduction).toBe(true);
    });
  });
});

// ============================================
// PROPERTY 7: CORS Origin Validation
// Requirements: 4.5
// ============================================

describe('Property 7: CORS Origin Validation', () => {
  
  describe('isValidOrigin', () => {
    it('should accept valid HTTP/HTTPS origins', () => {
      fc.assert(
        fc.property(
          validOriginUrl,
          (origin) => {
            return isValidOrigin(origin) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject origins with paths', () => {
      fc.assert(
        fc.property(
          validOriginUrl,
          fc.stringMatching(/^[a-z/]{1,10}$/),
          (origin, path) => {
            const withPath = `${origin}/${path}`;
            return isValidOrigin(withPath) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject origins with query strings', () => {
      fc.assert(
        fc.property(
          validOriginUrl,
          fc.stringMatching(/^[a-z=&]{1,10}$/),
          (origin, query) => {
            const withQuery = `${origin}?${query}`;
            return isValidOrigin(withQuery) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject origins with fragments', () => {
      fc.assert(
        fc.property(
          validOriginUrl,
          fc.stringMatching(/^[a-z]{1,10}$/),
          (origin, fragment) => {
            const withFragment = `${origin}#${fragment}`;
            return isValidOrigin(withFragment) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject empty or non-string inputs', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', null, undefined, 123, {}, []),
          (input) => {
            return isValidOrigin(input as string) === false;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject malformed URLs', () => {
      fc.assert(
        fc.property(
          invalidOrigin,
          (origin) => {
            return isValidOrigin(origin) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validateOrigins', () => {
    it('should not throw for valid origins', () => {
      fc.assert(
        fc.property(
          fc.array(validOriginUrl, { minLength: 0, maxLength: 5 }),
          (origins) => {
            try {
              validateOrigins(origins);
              return true;
            } catch {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw CorsValidationError for invalid origins', () => {
      fc.assert(
        fc.property(
          fc.array(validOriginUrl, { minLength: 0, maxLength: 3 }),
          invalidOrigin,
          (validOrigins, invalid) => {
            // Mix valid and invalid
            const mixed = [...validOrigins, invalid];
            
            try {
              validateOrigins(mixed);
              return false; // Should have thrown
            } catch (e) {
              return (
                e instanceof CorsValidationError &&
                e.invalidOrigin === invalid
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify the first invalid origin in the error', () => {
      fc.assert(
        fc.property(
          invalidOrigin,
          fc.array(validOriginUrl, { minLength: 0, maxLength: 3 }),
          (invalid, validOrigins) => {
            // Put invalid first
            const origins = [invalid, ...validOrigins];
            
            try {
              validateOrigins(origins);
              return false;
            } catch (e) {
              return (
                e instanceof CorsValidationError &&
                e.invalidOrigin === invalid
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getCorsConfig validation', () => {
    it('should throw when CORS_ORIGINS contains invalid URLs', () => {
      fc.assert(
        fc.property(
          fc.array(validOriginUrl, { minLength: 0, maxLength: 2 }),
          invalidOrigin.filter(o => o.length > 0 && o.trim().length > 0), // Filter out empty strings that would be filtered by parseOrigins
          (validOrigins, invalid) => {
            const originsString = [...validOrigins, invalid].join(',');
            
            try {
              getCorsConfigFromEnv(originsString, 'development');
              return false; // Should have thrown
            } catch (e) {
              return e instanceof CorsValidationError;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================
// Integration tests
// ============================================

describe('CORS Config Integration', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Reset env
    delete process.env.CORS_ORIGINS;
    delete process.env.NODE_ENV;
  });
  
  afterEach(() => {
    // Restore env
    process.env = { ...originalEnv };
  });

  it('should work end-to-end with valid origins', () => {
    fc.assert(
      fc.property(
        fc.array(validOriginUrl, { minLength: 1, maxLength: 3 }),
        (origins) => {
          const originsString = origins.join(',');
          const config = getCorsConfigFromEnv(originsString, 'development');
          
          return (
            config.origins.length === origins.length &&
            config.isProduction === false
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});

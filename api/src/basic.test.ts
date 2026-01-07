/**
 * Basic API Tests
 * Simple tests to ensure test setup works
 */

import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with objects', () => {
    const obj = { test: 'value' };
    expect(obj.test).toBe('value');
  });

  it('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });
});



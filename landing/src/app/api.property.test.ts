/**
 * Property-based tests for Landing API Client
 * **Feature: frontend-backend-sync, Property 4: Blog Comment Field Name**
 * **Validates: Requirements 1.1**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Mock fetch
const mockFetch = vi.fn();

describe('Landing API Client - Blog Comment Field Name', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Property 4: Blog Comment Field Name
   * For any blog comment submission, the request body SHALL use field `name` instead of `author`.
   * **Validates: Requirements 1.1**
   */
  it('should use "name" field instead of "author" in blog comment submissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }), // name
        fc.emailAddress(), // email
        fc.string({ minLength: 1, maxLength: 2000 }), // content
        fc.uuid(), // postId
        async (name, email, content, postId) => {
          // Reset mock before each iteration
          mockFetch.mockReset();
          
          // Mock successful response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                id: 'comment-1',
                postId,
                name,
                email,
                content,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
              },
            }),
          });

          // Import the API module dynamically to get fresh instance
          const { blogAPI } = await import('./api');

          // Call addComment with the correct field name
          await blogAPI.addComment(postId, { name, email, content });

          // Verify fetch was called
          expect(mockFetch).toHaveBeenCalledTimes(1);

          // Get the call arguments
          const [url, options] = mockFetch.mock.calls[0];

          // Verify URL contains the postId
          expect(url).toContain(`/blog/posts/${postId}/comments`);

          // Parse the request body
          const requestBody = JSON.parse(options.body);

          // Property: request body MUST have "name" field
          expect(requestBody).toHaveProperty('name');
          expect(requestBody.name).toBe(name);

          // Property: request body MUST NOT have "author" field
          expect(requestBody).not.toHaveProperty('author');

          // Verify other fields are present
          expect(requestBody).toHaveProperty('email');
          expect(requestBody.email).toBe(email);
          expect(requestBody).toHaveProperty('content');
          expect(requestBody.content).toBe(content);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4b: Blog comment type signature uses "name" field
   * The blogAPI.addComment function parameter type SHALL use "name" instead of "author"
   */
  it('should have correct type signature with "name" field', async () => {
    // Import the API module
    const { blogAPI } = await import('./api');

    // Verify the function exists
    expect(blogAPI.addComment).toBeDefined();
    expect(typeof blogAPI.addComment).toBe('function');

    // Mock successful response for type verification
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          id: 'comment-1',
          postId: 'post-1',
          name: 'Test User',
          email: 'test@example.com',
          content: 'Test content',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      }),
    });

    // This should compile without errors - using "name" field
    await blogAPI.addComment('post-1', {
      name: 'Test User',
      email: 'test@example.com',
      content: 'Test content',
    });

    // Verify the call was made
    expect(mockFetch).toHaveBeenCalled();
  });

  /**
   * Property 4c: Blog comment response contains "name" field
   * The response from addComment SHALL contain "name" field matching the input
   */
  it('should receive response with "name" field matching input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }), // name
        fc.emailAddress(), // email
        fc.string({ minLength: 1, maxLength: 500 }), // content
        async (name, email, content) => {
          const postId = 'test-post-id';

          // Mock response with name field
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                id: 'comment-1',
                postId,
                name, // Response uses "name" not "author"
                email,
                content,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
              },
            }),
          });

          const { blogAPI } = await import('./api');
          const result = await blogAPI.addComment(postId, { name, email, content });

          // Verify response has "name" field
          expect(result).toHaveProperty('name');
          expect(result.name).toBe(name);

          // Verify response does NOT have "author" field
          expect(result).not.toHaveProperty('author');
        }
      ),
      { numRuns: 100 }
    );
  });
});

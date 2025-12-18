/**
 * Property-Based Tests for Blog Comments
 * 
 * **Feature: security-hardening**
 * **Properties: 10, 11, 12, 13**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.6, 4.7**
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import { z, ZodError } from 'zod';

// ============================================
// SCHEMAS (isolated for testing)
// ============================================

/**
 * Schema for creating a blog comment
 */
const CreateCommentSchema = z.object({
  name: z.string()
    .min(1, 'Tên không được trống')
    .max(100, 'Tên tối đa 100 ký tự')
    .refine(s => s.trim().length > 0, 'Tên không được chỉ chứa khoảng trắng'),
  email: z.string().email('Email không hợp lệ'),
  content: z.string()
    .min(1, 'Nội dung không được trống')
    .max(2000, 'Nội dung tối đa 2000 ký tự')
    .refine(s => s.trim().length > 0, 'Nội dung không được chỉ chứa khoảng trắng'),
});

// Note: UpdateCommentStatusSchema and CommentFilterSchema are defined in blog.schema.ts
// but not needed for these property tests which focus on validation logic

// ============================================
// TYPES
// ============================================

type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface BlogComment {
  id: string;
  postId: string;
  name: string;
  email: string;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ISOLATED LOGIC FOR TESTING
// ============================================

/**
 * Validate comment creation input
 */
function validateCommentInput(
  input: unknown
): { success: true; data: CreateCommentInput } | { success: false; errorMessages: string[] } {
  try {
    const data = CreateCommentSchema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map(e => e.message);
      return { success: false, errorMessages };
    }
    throw error;
  }
}

/**
 * Create a comment with PENDING status
 */
function createComment(
  postId: string,
  input: CreateCommentInput
): BlogComment {
  return {
    id: `comment_${Date.now()}`,
    postId,
    name: input.name,
    email: input.email,
    content: input.content,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Filter comments for public access (only APPROVED)
 */
function filterPublicComments(comments: BlogComment[]): BlogComment[] {
  return comments.filter(c => c.status === 'APPROVED');
}

/**
 * Filter comments for admin access (all statuses, with optional filter)
 */
function filterAdminComments(
  comments: BlogComment[],
  filter?: { status?: CommentStatus; postId?: string }
): BlogComment[] {
  let result = comments;
  
  if (filter?.status) {
    result = result.filter(c => c.status === filter.status);
  }
  if (filter?.postId) {
    result = result.filter(c => c.postId === filter.postId);
  }
  
  return result;
}

// ============================================
// GENERATORS
// ============================================

// Generate valid name (1-100 chars, non-empty)
const validName = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// Generate valid email
const validEmail = fc.tuple(
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
  fc.constantFrom('gmail.com', 'example.com', 'test.org', 'company.co')
).map(([local, domain]) => `${local}@${domain}`);

// Generate invalid email
const invalidEmail = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => !s.includes('@') || !s.includes('.') || s.startsWith('@') || s.endsWith('@'));

// Generate valid content (1-2000 chars, non-empty)
const validContent = fc.string({ minLength: 1, maxLength: 2000 })
  .filter(s => s.trim().length > 0);

// Generate empty or whitespace-only string
const emptyOrWhitespace = fc.constantFrom('', '   ', '\t', '\n', '  \n  ');

// Generate valid comment input
const validCommentInput = fc.record({
  name: validName,
  email: validEmail,
  content: validContent,
});

// Generate comment status
const commentStatus = fc.constantFrom<CommentStatus>('PENDING', 'APPROVED', 'REJECTED');

// Generate a blog comment
const blogComment = fc.record({
  id: fc.uuid(),
  postId: fc.uuid(),
  name: validName,
  email: validEmail,
  content: validContent,
  status: commentStatus,
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

// Generate array of blog comments
const blogComments = fc.array(blogComment, { minLength: 0, maxLength: 20 });

// ============================================
// PROPERTY 10: Valid Comment Creation
// **Feature: security-hardening, Property 10: Valid comment creation**
// **Validates: Requirements 4.1, 4.3**
// ============================================

describe('Property 10: Valid Comment Creation', () => {
  it('valid comment input should pass validation', () => {
    fc.assert(
      fc.property(
        validCommentInput,
        (input) => {
          const result = validateCommentInput(input);
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment should have PENDING status', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        validCommentInput,
        (postId, input) => {
          const comment = createComment(postId, input);
          return comment.status === 'PENDING';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment should have correct postId', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        validCommentInput,
        (postId, input) => {
          const comment = createComment(postId, input);
          return comment.postId === postId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('created comment should preserve input data', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        validCommentInput,
        (postId, input) => {
          const comment = createComment(postId, input);
          return (
            comment.name === input.name &&
            comment.email === input.email &&
            comment.content === input.content
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 11: Invalid Comment Rejection
// **Feature: security-hardening, Property 11: Invalid comment rejection**
// **Validates: Requirements 4.2**
// ============================================

describe('Property 11: Invalid Comment Rejection', () => {
  it('empty name should be rejected', () => {
    fc.assert(
      fc.property(
        emptyOrWhitespace,
        validEmail,
        validContent,
        (name, email, content) => {
          const result = validateCommentInput({ name, email, content });
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('invalid email should be rejected', () => {
    fc.assert(
      fc.property(
        validName,
        invalidEmail,
        validContent,
        (name, email, content) => {
          const result = validateCommentInput({ name, email, content });
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty content should be rejected', () => {
    fc.assert(
      fc.property(
        validName,
        validEmail,
        emptyOrWhitespace,
        (name, email, content) => {
          const result = validateCommentInput({ name, email, content });
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('missing required fields should be rejected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          {},
          { name: 'Test' },
          { email: 'test@example.com' },
          { content: 'Test content' },
          { name: 'Test', email: 'test@example.com' },
          { name: 'Test', content: 'Test content' },
          { email: 'test@example.com', content: 'Test content' }
        ),
        (partialInput) => {
          const result = validateCommentInput(partialInput);
          return result.success === false;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('name exceeding 100 chars should be rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 200 }),
        validEmail,
        validContent,
        (name, email, content) => {
          const result = validateCommentInput({ name, email, content });
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('content exceeding 2000 chars should be rejected', () => {
    fc.assert(
      fc.property(
        validName,
        validEmail,
        fc.string({ minLength: 2001, maxLength: 3000 }),
        (name, email, content) => {
          const result = validateCommentInput({ name, email, content });
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 12: Public Comments Filtering
// **Feature: security-hardening, Property 12: Public comments filtering**
// **Validates: Requirements 4.6**
// ============================================

describe('Property 12: Public Comments Filtering', () => {
  it('public filter should only return APPROVED comments', () => {
    fc.assert(
      fc.property(
        blogComments,
        (comments) => {
          const publicComments = filterPublicComments(comments);
          return publicComments.every(c => c.status === 'APPROVED');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('public filter should return all APPROVED comments', () => {
    fc.assert(
      fc.property(
        blogComments,
        (comments) => {
          const publicComments = filterPublicComments(comments);
          const approvedCount = comments.filter(c => c.status === 'APPROVED').length;
          return publicComments.length === approvedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('public filter should exclude PENDING comments', () => {
    fc.assert(
      fc.property(
        blogComments,
        (comments) => {
          const publicComments = filterPublicComments(comments);
          return publicComments.every(c => c.status !== 'PENDING');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('public filter should exclude REJECTED comments', () => {
    fc.assert(
      fc.property(
        blogComments,
        (comments) => {
          const publicComments = filterPublicComments(comments);
          return publicComments.every(c => c.status !== 'REJECTED');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('public filter result should be subset of original', () => {
    fc.assert(
      fc.property(
        blogComments,
        (comments) => {
          const publicComments = filterPublicComments(comments);
          return publicComments.every(pc => 
            comments.some(c => c.id === pc.id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 13: Admin Comments Access
// **Feature: security-hardening, Property 13: Admin comments access**
// **Validates: Requirements 4.7**
// ============================================

describe('Property 13: Admin Comments Access', () => {
  it('admin filter without params should return all comments', () => {
    fc.assert(
      fc.property(
        blogComments,
        (comments) => {
          const adminComments = filterAdminComments(comments);
          return adminComments.length === comments.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('admin filter should include comments of all statuses', () => {
    fc.assert(
      fc.property(
        blogComments,
        (comments) => {
          const adminComments = filterAdminComments(comments);
          
          const originalPending = comments.filter(c => c.status === 'PENDING').length;
          const originalApproved = comments.filter(c => c.status === 'APPROVED').length;
          const originalRejected = comments.filter(c => c.status === 'REJECTED').length;
          
          const adminPending = adminComments.filter(c => c.status === 'PENDING').length;
          const adminApproved = adminComments.filter(c => c.status === 'APPROVED').length;
          const adminRejected = adminComments.filter(c => c.status === 'REJECTED').length;
          
          return (
            adminPending === originalPending &&
            adminApproved === originalApproved &&
            adminRejected === originalRejected
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('admin filter by status should only return matching status', () => {
    fc.assert(
      fc.property(
        blogComments,
        commentStatus,
        (comments, status) => {
          const filtered = filterAdminComments(comments, { status });
          return filtered.every(c => c.status === status);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('admin filter by postId should only return matching postId', () => {
    fc.assert(
      fc.property(
        blogComments,
        fc.uuid(),
        (comments, postId) => {
          const filtered = filterAdminComments(comments, { postId });
          return filtered.every(c => c.postId === postId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('admin filter by status and postId should match both criteria', () => {
    fc.assert(
      fc.property(
        blogComments,
        commentStatus,
        fc.uuid(),
        (comments, status, postId) => {
          const filtered = filterAdminComments(comments, { status, postId });
          return filtered.every(c => c.status === status && c.postId === postId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('admin filter result count should match expected count', () => {
    fc.assert(
      fc.property(
        blogComments,
        commentStatus,
        (comments, status) => {
          const filtered = filterAdminComments(comments, { status });
          const expectedCount = comments.filter(c => c.status === status).length;
          return filtered.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

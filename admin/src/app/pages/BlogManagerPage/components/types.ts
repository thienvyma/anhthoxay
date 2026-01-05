// Types for BlogManagerPage

export interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  categoryId: string;
  tags: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
}

export const INITIAL_POST_FORM: PostFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: '',
  categoryId: '',
  tags: '',
  status: 'DRAFT',
  isFeatured: false,
};

export const INITIAL_CATEGORY_FORM: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  color: '#3b82f6',
};

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

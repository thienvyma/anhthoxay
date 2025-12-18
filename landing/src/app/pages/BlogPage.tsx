import { PageRenderer } from '../components/PageRenderer';
import type { PageData } from '../types';

export function BlogPage({ page }: { page?: PageData }) {
  return <PageRenderer page={page || null} eagerSections={2} />;
}

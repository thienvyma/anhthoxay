import { PageRenderer } from '../components/PageRenderer';
import type { PageData } from '../types';

export function HomePage({ page }: { page: PageData }) {
  return <PageRenderer page={page} eagerSections={2} />;
}

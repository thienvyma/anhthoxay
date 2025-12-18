import { PageRenderer } from '../components/PageRenderer';
import type { PageData } from '../types';

export function ContactPage({ page }: { page: PageData }) {
  return <PageRenderer page={page} eagerSections={1} />;
}

import { PageRenderer } from '../components/PageRenderer';
import { MaintenancePage } from '../components/MaintenancePage';
import type { PageData } from '../types';

export function ContactPage({ page }: { page: PageData }) {
  // Check if page is disabled (isActive === false)
  if (page.isActive === false) {
    return <MaintenancePage title="Trang Liên hệ - Sắp Ra Mắt" />;
  }

  return <PageRenderer page={page} eagerSections={1} />;
}

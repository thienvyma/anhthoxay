import { PageRenderer } from '../components/PageRenderer';
import { MaintenancePage } from '../components/MaintenancePage';
import type { PageData } from '../types';

export function AboutPage({ page }: { page: PageData }) {
  // Check if page is disabled (isActive === false)
  if (page.isActive === false) {
    return <MaintenancePage title="Trang Giới thiệu - Sắp Ra Mắt" />;
  }

  return <PageRenderer page={page} eagerSections={2} />;
}

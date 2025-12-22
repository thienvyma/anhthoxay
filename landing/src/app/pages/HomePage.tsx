import { PageRenderer } from '../components/PageRenderer';
import { MaintenancePage } from '../components/MaintenancePage';
import type { PageData } from '../types';

export function HomePage({ page }: { page: PageData }) {
  // Check if page is disabled (isActive === false)
  if (page.isActive === false) {
    return (
      <MaintenancePage 
        title="Website - Sắp Ra Mắt"
        message="Chúng tôi đang hoàn thiện website để phục vụ bạn tốt hơn. Vui lòng quay lại sau!"
        showHomeLink={false}
      />
    );
  }

  return <PageRenderer page={page} eagerSections={2} />;
}

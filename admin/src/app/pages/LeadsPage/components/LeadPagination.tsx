import { tokens } from '@app/shared';
import { Button } from '../../../components/Button';
import { ResponsiveStack } from '../../../../components/responsive/ResponsiveStack';

export interface LeadPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isMobile: boolean;
}

export function LeadPagination({
  currentPage,
  totalPages,
  onPageChange,
  isMobile,
}: LeadPaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    
    return pages;
  };

  return (
    <ResponsiveStack 
      direction={{ mobile: 'row', tablet: 'row', desktop: 'row' }} 
      justify="center" 
      align="center" 
      gap={8} 
      style={{ marginTop: 24 }}
    >
      <Button 
        variant="outline" 
        size="small" 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
        disabled={currentPage === 1}
      >
        <i className="ri-arrow-left-s-line" />
      </Button>
      
      {!isMobile && getPageNumbers().map(pageNum => (
        <Button 
          key={pageNum} 
          variant={currentPage === pageNum ? 'primary' : 'outline'} 
          size="small" 
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </Button>
      ))}
      
      {isMobile && (
        <span style={{ color: tokens.color.muted, fontSize: 13, padding: '0 8px' }}>
          {currentPage}/{totalPages}
        </span>
      )}
      
      <Button 
        variant="outline" 
        size="small" 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
        disabled={currentPage === totalPages}
      >
        <i className="ri-arrow-right-s-line" />
      </Button>
    </ResponsiveStack>
  );
}

import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PageableListProps<T> {
  items: T[];
  totalItems: number;
  isLoading?: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: (index: number) => number;
  overscan?: number;
  className?: string;
}

export function PageableList<T>({
  items,
  totalItems,
  isLoading = false,
  currentPage,
  pageSize,
  onPageChange,
  renderItem,
  estimateSize = () => 50,
  overscan = 5,
  className = '',
}: PageableListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
  });

  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 1; // Reduced from 2 to 1 for space efficiency
    const range: (number | string)[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= currentPage - delta && i <= currentPage + delta) // Pages around current
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    
    return range;
  };

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={parentRef}
        className={`flex-1 overflow-auto ${className}`}
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {renderItem(item, virtualRow.index)}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex flex-col border-t">
        <div className="text-center py-2 text-sm text-muted-foreground mt-2">
          {isLoading ? (
            <span>Loading...</span>
          ) : (
            <span>
              Page {currentPage} of {totalPages}
              {' · '}
              {totalItems.toLocaleString()} items
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-center px-2 pb-2 gap-1">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 1 || isLoading}
              onClick={() => onPageChange(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-sm text-muted-foreground">...</span>
              ) : (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 px-0"
                  disabled={isLoading}
                  onClick={() => onPageChange(pageNum as number)}
                >
                  {pageNum}
                </Button>
              )
            ))}
          </div>
          
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === totalPages || isLoading}
              onClick={() => onPageChange(totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
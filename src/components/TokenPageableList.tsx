import React from 'react';
import { PageableList } from './PageableList';
import { Button } from './ui/button';
import { Upload, Plus, CheckSquare } from 'lucide-react';
import type { Token } from '@/lib/api/megadata';

interface TokenPageableListProps {
  items: Token[];
  totalItems: number;
  isLoading?: boolean;
  currentPage: number;
  pageSize: number;
  selectedToken?: Token | null;
  onTokenClick: (token: Token) => void;
  onPageChange: (page: number) => void;
  onImageUpload?: (token: Token, file: File) => void;
  tokensToPublish?: Set<string>;
  onTogglePublishSelection?: (tokenId: string) => void;
  onCreateToken?: () => void;
  className?: string;
}

export function TokenPageableList({
  items,
  totalItems,
  isLoading = false,
  currentPage,
  pageSize,
  selectedToken,
  onTokenClick,
  onPageChange,
  onImageUpload,
  tokensToPublish = new Set(),
  onTogglePublishSelection,
  onCreateToken,
  className = '',
}: TokenPageableListProps) {
  const handleImageUpload = async (token: Token, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpload) return;
    await onImageUpload(token, file);
  };

  const handleSelectAll = () => {
    if (!onTogglePublishSelection) return;
    
    // If all publishable tokens are selected, deselect all
    const publishableTokens = items.filter(token => !token.is_published);
    const allSelected = publishableTokens.every(token => tokensToPublish.has(token.id));
    
    publishableTokens.forEach(token => {
      if (allSelected) {
        // Deselect if all are currently selected
        onTogglePublishSelection(token.id);
      } else if (!tokensToPublish.has(token.id)) {
        // Select if not all are currently selected
        onTogglePublishSelection(token.id);
      }
    });
  };

  const renderToken = (token: Token, index: number) => {
    const isSelected = selectedToken?.id === token.id;
    const isPublishable = !token.is_published && onTogglePublishSelection;
    const isSelectedForPublish = tokensToPublish.has(token.id);

    return (
      <div
        className={`
          flex items-center justify-between px-3 py-2 cursor-pointer
          hover:bg-accent/50 rounded-lg transition-colors
          ${isSelected ? 'bg-accent' : ''}
        `}
        onClick={() => onTokenClick(token)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{token.id}</div>
            {token.is_published && (
              <div className="text-xs text-muted-foreground">Published</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {onImageUpload && (
            <div onClick={e => e.stopPropagation()}>
              <input
                type="file"
                id={`image-upload-${token.id}`}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(token, e)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                asChild
              >
                <label htmlFor={`image-upload-${token.id}`}>
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload image</span>
                </label>
              </Button>
            </div>
          )}
          
          {isPublishable && (
            <input
              type="checkbox"
              checked={isSelectedForPublish}
              onChange={() => onTogglePublishSelection(token.id)}
              onClick={e => e.stopPropagation()}
              className="h-4 w-4"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pb-2 flex flex-wrap gap-2 items-center">
        {onTogglePublishSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-7"
          >
            <CheckSquare className="h-4 w-4 mr-1.5" />
            Select All
          </Button>
        )}
        {onCreateToken && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateToken}
            className="h-7"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create New
          </Button>
        )}
      </div>
      <PageableList
        items={items}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={onPageChange}
        renderItem={renderToken}
        className={className}
        estimateSize={() => 56} // Reduced height of each token row
      />
    </div>
  );
} 
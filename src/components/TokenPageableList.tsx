import React from 'react';
import { PageableList } from './PageableList';
import { Button } from './ui/button';
import { Plus, CheckSquare, Check } from 'lucide-react';
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
  allowTokenCreation?: boolean;
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
  tokensToPublish = new Set(),
  onTogglePublishSelection,
  onCreateToken,
  allowTokenCreation = true,
  className = '',
}: TokenPageableListProps) {
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
          </div>
        </div>

        <div className="flex items-center gap-2 ml-2">          
          {token.is_published && (
            <Check className="h-4 w-4 text-muted-foreground" />
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
      <div className="px-3 pb-3 flex flex-col gap-3 border-b border-border/50">
        <div className="flex flex-wrap gap-2 items-center">
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
              disabled={!allowTokenCreation}
              title={!allowTokenCreation ? "Cannot create tokens for external collections" : undefined}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create New
            </Button>
          )}
        </div>
        <div className="flex items-center justify-center">
          <PageableList
            items={items}
            totalItems={totalItems}
            currentPage={currentPage}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={onPageChange}
            renderItem={renderToken}
            className={className}
            estimateSize={() => 56}
          />
        </div>
      </div>
      <div className="mt-2 flex-1 overflow-y-auto px-3">
        {items.map((token, index) => renderToken(token, index))}
      </div>
    </div>
  );
} 
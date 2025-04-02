import { memo, useRef, useMemo } from 'react';
import { Database, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExtendedMegaDataItem } from '@/lib/api/localStorage';
import { useVirtualizer } from '@tanstack/react-virtual';

interface TokenListProps {
  items: ExtendedMegaDataItem[];
  selectedItem: ExtendedMegaDataItem | null;
  validationErrors: Record<string, string[]>;
  isPublished: boolean;
  onTokenClick: (item: ExtendedMegaDataItem) => void;
  onDeleteToken: (tokenId: string) => void;
  editingTokenId: string | null;
  newTokenId: string;
  onTokenIdChange: (oldTokenId: string, newTokenId: string) => void;
  onNewTokenIdChange: (value: string) => void;
  isCreatingItem: boolean;
  onNewTokenKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onNewTokenBlur: () => void;
  onImageUpload: (item: ExtendedMegaDataItem, file: File) => Promise<void>;
}

const ITEM_HEIGHT = 68;

const TokenItem = memo(({ 
  item, 
  isSelected, 
  hasErrors, 
  isPublished, 
  onClick, 
  onDelete, 
  isEditing, 
  newTokenId, 
  onTokenIdChange,
  onNewTokenIdChange,
}: {
  item: ExtendedMegaDataItem;
  isSelected: boolean;
  hasErrors: boolean;
  isPublished: boolean;
  onClick: () => void;
  onDelete: () => void;
  isEditing: boolean;
  newTokenId: string;
  onTokenIdChange: () => void;
  onNewTokenIdChange: (value: string) => void;
}) => {
  const hasImage = item.properties.erc721?.image && item.properties.erc721.image !== "https://placeholder.com/image.png";

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-4 rounded-md cursor-pointer transition-colors h-[60px] ${
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
      } ${hasErrors ? 'border-red-500 border' : ''}`}
    >
      {isEditing && !isPublished ? (
        <input
          type="text"
          value={newTokenId}
          onChange={(e) => onNewTokenIdChange(e.target.value)}
          onBlur={onTokenIdChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onTokenIdChange();
            }
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          autoFocus
        />
      ) : (
        <span
          onDoubleClick={() => {
            if (!isPublished) {
              onNewTokenIdChange(item.tokenId);
            }
          }}
          className="flex-1 text-base"
        >
          {item.tokenId}
        </span>
      )}
      <div className="flex items-center gap-3 min-w-[48px]">
        <ImageIcon className={`h-4 w-4 ${hasImage ? 'text-green-500' : 'text-muted-foreground'}`} />
      </div>
      {!isPublished && (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

TokenItem.displayName = 'TokenItem';

const TokenList = memo(({
  items,
  selectedItem,
  validationErrors,
  isPublished,
  onTokenClick,
  onDeleteToken,
  editingTokenId,
  newTokenId,
  onTokenIdChange,
  onNewTokenIdChange,
  isCreatingItem,
  onNewTokenKeyDown,
  onNewTokenBlur,
  onImageUpload,
}: TokenListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5
  });

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable container with fixed height */}
      <div className="flex-1 px-6">
        <div 
          ref={parentRef}
          className="h-[calc(100vh-300px)] overflow-y-auto"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = items[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <TokenItem
                    item={item}
                    isSelected={selectedItem?.tokenId === item.tokenId}
                    hasErrors={validationErrors[item.tokenId]?.length > 0}
                    isPublished={isPublished}
                    onClick={() => onTokenClick(item)}
                    onDelete={() => onDeleteToken(item.tokenId)}
                    isEditing={editingTokenId === item.tokenId}
                    newTokenId={newTokenId}
                    onTokenIdChange={() => onTokenIdChange(item.tokenId, newTokenId)}
                    onNewTokenIdChange={onNewTokenIdChange}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Create item input at the bottom */}
      {isCreatingItem && (
        <div className="flex items-center p-3 rounded-md bg-muted/50 mx-6 mb-6 mt-2">
          <Database className="mr-2 h-4 w-4" />
          <input
            type="text"
            value={newTokenId}
            onChange={(e) => onNewTokenIdChange(e.target.value)}
            placeholder="Enter Token ID (e.g., 1, 2, 3, or #1, #2, #3)"
            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
            onKeyDown={onNewTokenKeyDown}
            onBlur={onNewTokenBlur}
          />
        </div>
      )}
    </div>
  );
});

TokenList.displayName = 'TokenList';

export default TokenList; 
import { memo, useRef, useState, useEffect } from 'react';
import { Trash2, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Token } from '@/lib/api/megadata';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Checkbox } from '@/components/ui/checkbox';

interface TokenListProps {
  items: Token[];
  selectedItem: Token | null;
  validationErrors: Record<string, string[]>;
  onTokenClick: (token: Token) => void;
  newTokenId: string;
  onNewTokenIdChange: (tokenId: string) => void;
  onNewTokenBlur: () => void;
  onImageUpload: (token: Token, file: File) => void;
  tokensToPublish: Set<string>;
  onTogglePublishSelection: (tokenId: string) => void;
}

const ITEM_HEIGHT = 60;

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
  item: Token;
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
  const hasImage = item.data.image && item.data.image !== "https://placeholder.com/image.png";

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-4 rounded-md cursor-pointer transition-colors h-[60px] ${
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
      } ${hasErrors ? 'border-red-500 border' : ''}`}
    >
      {isEditing && !isPublished && !item.is_published ? (
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
            if (!item.is_published) {
              onNewTokenIdChange(item.id);
            }
          }}
          className="flex-1 text-base"
        >
          {item.id}
        </span>
      )}
      <div className="flex items-center gap-3 min-w-[48px]">
        <ImageIcon className={`h-4 w-4 ${hasImage ? 'text-green-500' : 'text-muted-foreground'}`} />
      </div>
      {!item.is_published && (
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
  onTokenClick,
  newTokenId,
  onNewTokenIdChange,
  onNewTokenBlur,
  onImageUpload,
  tokensToPublish,
  onTogglePublishSelection,
}: TokenListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [internalNewTokenId, setInternalNewTokenId] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTokenId, setUploadingTokenId] = useState<string | null>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: items.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  useEffect(() => {
    setInternalNewTokenId(newTokenId);
  }, [newTokenId]);

  const handleInternalNewTokenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalNewTokenId(e.target.value);
    onNewTokenIdChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && internalNewTokenId.trim()) {
      onNewTokenBlur();
    }
  };

  const handleImageUpload = async (token: Token, file: File) => {
    await onImageUpload(token, file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uploadingTokenId) {
      const token = items.find(t => t.id === uploadingTokenId);
      if (token) {
        onImageUpload(token, e.target.files[0]);
      }
    }
    setUploadingTokenId(null);
    if (imageInputRef.current) {
        imageInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={parentRef} className="flex-grow overflow-y-auto rounded-md border">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const isLastItem = virtualItem.index >= items.length;
            
            if (isLastItem) {
              return (
                <div
                  key="__new_token_input__"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                    padding: '4px', 
                  }}
                >
                  <div className="h-full px-2 flex items-center"> 
                    <Input
                      placeholder="Enter ID of new token & press Enter"
                      value={internalNewTokenId}
                      onChange={handleInternalNewTokenIdChange}
                      onKeyDown={handleKeyDown}
                      onBlur={onNewTokenBlur}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              );
            }
            
            const token = items[virtualItem.index];
            const isSelected = token?.id === selectedItem?.id;
            const hasError = token ? validationErrors[token.id]?.length > 0 : false;
            const isPublished = token?.is_published;

            return (
              <div
                key={token.id} 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '4px', 
                }}
              >
                <div 
                  className={`h-full rounded-md flex items-center px-3 cursor-pointer transition-colors border border-transparent ${ 
                      isSelected ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50' 
                  } ${isPublished ? 'opacity-60' : ''}`}
                  onClick={() => onTokenClick(token)}
                >
                  <div className="flex-shrink-0 mr-3 w-4 h-4">
                      {!isPublished ? (
                         <Checkbox
                              id={`publish-${token.id}`}
                              checked={tokensToPublish.has(token.id)}
                              onCheckedChange={() => onTogglePublishSelection(token.id)}
                              onClick={(e) => e.stopPropagation()} 
                          />
                      ) : (
                          <CheckCircle className="w-full h-full text-green-600" /> 
                      )}
                  </div>
                    
                  <span className="flex-grow font-medium truncate text-sm" title={token.data.name || token.id}>
                      {token.id}
                  </span>
                    
                  <div className="flex-shrink-0 ml-2 w-4 h-4">
                      {hasError && !isPublished && 
                         <AlertCircle className="w-full h-full text-destructive" />
                      }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
});

TokenList.displayName = 'TokenList';

export default TokenList; 
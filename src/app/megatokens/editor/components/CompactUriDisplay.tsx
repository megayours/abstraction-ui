'use client';

import { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Copy, Globe, FileText, LinkIcon, Zap, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { config } from '@/lib/config';
import { Collection, Token, ExternalCollectionDetails } from '@/lib/api/megadata';
import { SPECIAL_MODULES } from '@/lib/constants';
import { toast } from 'sonner';

type UriType = 'base' | 'token' | 'gateway';

type CompactUriDisplayProps = {
  collection: Collection | null;
  selectedToken: Token | null;
  externalDetails: ExternalCollectionDetails | null;
  isLoadingExternalDetails: boolean;
};

export function CompactUriDisplay({
  collection,
  selectedToken,
  externalDetails,
  isLoadingExternalDetails,
}: CompactUriDisplayProps) {
  const [selectedUriType, setSelectedUriType] = useState<UriType>('base');

  useEffect(() => {
    if (collection?.type === 'external') {
      setSelectedUriType('gateway');
    }
  }, [collection]);

  const uris = useMemo(() => {
    if (!collection) return {};

    const base = `${config.megaRouterUri}/megadata/${collection.id}/`;
    let token: string | null = null;
    let gateway: string | null = null;

    if (selectedToken) {
      token = `${base}${selectedToken.id}`;
      if (selectedToken.modules.includes(SPECIAL_MODULES.EXTENDING_METADATA) && selectedToken.data?.uri) {
        setSelectedUriType('gateway');
        gateway = `${config.megaRouterUri}/ext/${selectedToken.data.uri}`;
      } else {
        setSelectedUriType('token');
      }
    } else {
      setSelectedUriType('base');
    }

    return { base, token, gateway };
  }, [collection, selectedToken]);

  const availableUriTypes = useMemo(() => {
    const types: { value: UriType; label: string; icon: React.ElementType }[] = [
      { value: 'base', label: 'Collection Base URI', icon: Globe },
    ];
    if (uris.token) {
      types.push({ value: 'token', label: 'Token URI', icon: FileText });
    }
    if (uris.gateway) {
      types.push({ value: 'gateway', label: 'Extended URI', icon: LinkIcon });
    }
    return types;
  }, [uris]);

  // Adjust selected type if it becomes unavailable
  useState(() => {
    if (!availableUriTypes.some(t => t.value === selectedUriType)) {
      setSelectedUriType('base');
    }
  });

  const selectedUri = useMemo(() => {
    return uris[selectedUriType] || null;
  }, [selectedUriType, uris]);

  const SelectedIcon = availableUriTypes.find(t => t.value === selectedUriType)?.icon || Globe;

  const handleCopy = () => {
    if (!selectedUri) return;
    navigator.clipboard.writeText(selectedUri)
      .then(() => toast.success(`${availableUriTypes.find(t => t.value === selectedUriType)?.label} copied!`))
      .catch(err => {
        console.error('Failed to copy URI:', err);
        toast.error('Failed to copy URI.');
      });
  };

  return (
    <div className="space-y-3">
      {collection?.type === 'external' && (
        <div className="text-xs border border-border/30 p-2.5 rounded-md bg-muted/40">
          <p className="font-medium text-foreground mb-1.5 text-[11px] uppercase tracking-wider">Sync Status</p>
          {isLoadingExternalDetails ? (
            <span className="flex items-center text-muted-foreground">Loading...</span>
          ) : externalDetails ? (
            externalDetails.last_checked !== null ? (
              <span className="flex items-center text-muted-foreground">
                <Zap className="h-3 w-3 mr-1.5 text-green-600 flex-shrink-0" />
                Last Synced: {new Date(externalDetails.last_checked * 1000).toLocaleString()}
              </span>
            ) : (
              <span className="flex items-center text-orange-600">
                <AlertCircle className="h-3 w-3 mr-1.5 flex-shrink-0" />
                Indexing...
              </span>
            )
          ) : (
            <span className="text-xs text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1.5 flex-shrink-0" />
              Load Failed
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Select
          value={selectedUriType}
          onValueChange={(value) => setSelectedUriType(value as UriType)}
          disabled={availableUriTypes.length <= 1}
        >
          <SelectTrigger className="sm:w-[180px] h-9 rounded-md text-xs flex-shrink-0">
             <SelectValue placeholder="Select URI type..." />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            {availableUriTypes.map(({ value, label, icon: Icon }) => (
              <SelectItem key={value} value={value} className="text-xs cursor-pointer">
                 <div className="flex items-center gap-2">
                   <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                   {label}
                 </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-xs border border-border/30 flex-grow min-w-0 h-9 overflow-hidden">
           <SelectedIcon className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
           <TooltipProvider delayDuration={100}>
             <Tooltip>
               <TooltipTrigger asChild>
                 <code className="font-mono text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap cursor-default">
                   {selectedUri ? selectedUri.replace(/^https?:\/\//, '') : 'Select a Token'}
                 </code>
               </TooltipTrigger>
               <TooltipContent className="max-w-xs break-all">
                 <p>{selectedUri}</p>
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
           <Button
             variant="ghost"
             size="icon"
             className="h-6 w-6 shrink-0"
             onClick={handleCopy}
             disabled={!selectedUri}
             title={`Copy ${availableUriTypes.find(t => t.value === selectedUriType)?.label || ''}`}
           >
             <Copy className="h-3.5 w-3.5" />
           </Button>
        </div>
      </div>
    </div>
  );
} 
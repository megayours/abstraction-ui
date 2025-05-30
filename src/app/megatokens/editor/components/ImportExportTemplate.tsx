import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { MegaDataItem } from '@/lib/types';
import { validateMegadata } from '../utils/validation';
import { exportLocalData, importLocalData } from '@/lib/api/localStorage';

interface ImportExportTemplateProps {
  onImport: (data: any) => void;
  items: MegaDataItem[];
  published: boolean;
  collectionId: string;
  allowImport?: boolean;
}

export default function ImportExportTemplate({ onImport, items, collectionId, published, allowImport = true }: ImportExportTemplateProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = () => {
    const template = [
      {
        tokenId: "example_token_id",
        megadata: {
          erc721: {
            name: "Example NFT",
            description: "This is an example NFT",
            external_url: "https://example.com",
            image: "https://example.com/image.png",
            attributes: [
              {
                trait_type: "Background",
                value: "Blue"
              },
              {
                trait_type: "Rarity",
                value: 100,
                display_type: "number"
              }
            ]
          }
        }
      }
    ];

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'megadata-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCurrentData = () => {
    // Export only the current collection data in a simplified format
    const exportData = exportLocalData();
    const items = exportData.items[collectionId] || [];
    
    // Create a simplified array with just tokenId and megadata (using item.data)
    const simplifiedItems = items.map(item => ({
      tokenId: item.tokenId,
      megadata: {
        // Access data, not properties
        erc721: item.data?.erc721 
      }
    }));
    
    const blob = new Blob([JSON.stringify(simplifiedItems, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `megadata-collection-${collectionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Check the format of the imported data
        if (data.collections && data.items) {
          // It's our old export format with collections and items
          const success = importLocalData(data);
          if (success) {
            onImport(data);
          } else {
            setError('Failed to import data');
          }
        } else if (Array.isArray(data)) {
          // It's the new simplified array format or an array of items
          // validateMegadata has been updated to handle both megadata and properties fields
          const { isValid, errors } = validateMegadata(data);
          
          if (!isValid) {
            setError(`Validation failed: ${errors.join(', ')}`);
            setIsImporting(false);
            return;
          }
          
          onImport(data);
        } else {
          // Unsupported format
          setError('Invalid data format. Expected an array of items or a collections/items object.');
        }
      } catch (error) {
        setError('Invalid JSON file');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={items.length > 0 ? downloadCurrentData : downloadTemplate}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {items.length > 0 ? 'Download Current Data' : 'Download Template'}
        </Button>
        {!published && (
          <div className="relative">
            <Input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              disabled={isImporting || !allowImport}
              className="hidden"
            id="metadata-import"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('metadata-import')?.click()}
            className="flex items-center gap-2"
            disabled={isImporting || !allowImport}
            title={!allowImport ? "Cannot import tokens into external collections" : undefined}
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import JSON'}
          </Button>
        </div>
        )}
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 
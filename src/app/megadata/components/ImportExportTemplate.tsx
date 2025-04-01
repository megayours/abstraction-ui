import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { MegaDataItem } from '@/lib/types';
import { validateMegadata } from '../utils/validation';

interface ImportExportTemplateProps {
  onImport: (data: any) => void;
  items: any[];
}

export default function ImportExportTemplate({ onImport, items }: ImportExportTemplateProps) {
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
    const data = items.map(item => ({
      token_id: item.token_id,
      metadata: item.metadata
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'megadata.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const { isValid, errors } = validateMegadata(data);
        
        if (!isValid) {
          setError(`Validation failed: ${errors.join(', ')}`);
          return;
        }
        
        onImport(data);
      } catch (error) {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Import/Export Metadata</CardTitle>
        <CardDescription>
          {items.length > 0 
            ? "Download your current metadata to modify it offline, or import a modified version."
            : "Download a template to prepare your metadata offline, or import prepared metadata."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button
          variant="outline"
          onClick={items.length > 0 ? downloadCurrentData : downloadTemplate}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {items.length > 0 ? 'Download Current Data' : 'Download Template'}
        </Button>
        <div className="relative">
          <Input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            disabled={isImporting}
            className="hidden"
            id="metadata-import"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('metadata-import')?.click()}
            className="flex items-center gap-2"
            disabled={isImporting}
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import JSON'}
          </Button>
        </div>
      </CardContent>
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
    </Card>
  );
} 
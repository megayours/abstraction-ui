import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ImagePickerDialog } from './ImagePickerDialog';
import { ExtendedMegaDataItem } from '@/lib/api/localStorage';
import { Textarea } from '@/components/ui/textarea';

interface Attribute {
  trait_type: string;
  value: string | number;
  display_type?: "boost_number" | "boost_percentage" | "number" | "text";
}

interface ERC721Data {
  name?: string;
  description?: string;
  external_url?: string;
  image?: string;
  attributes?: Attribute[];
}

interface MegadataFormProps {
  value: {
    erc721?: ERC721Data;
  };
  onChange: (value: { erc721: ERC721Data }) => void;
  readOnly?: boolean;
  item: ExtendedMegaDataItem;
}

export default function MegadataForm({ value, onChange, readOnly = false, item }: MegadataFormProps) {
  const [attributes, setAttributes] = useState<Attribute[]>(value.erc721?.attributes || []);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  useEffect(() => {
    setAttributes(value.erc721?.attributes || []);
  }, [value.erc721?.attributes]);

  const handleChange = (field: keyof ERC721Data, newValue: string) => {
    if (readOnly) return;

    // Create a new ERC721Data object with the updated field
    const newErc721Data: ERC721Data = {
      ...value.erc721,
      [field]: newValue || undefined  // Set to undefined if empty string
    };

    // Call onChange with the complete new value
    onChange({
      erc721: newErc721Data
    });
  };

  const handleAttributeChange = (index: number, field: keyof Attribute, newValue: string) => {
    if (readOnly) return;

    const newAttributes = [...attributes];
    if (field === 'value') {
      // Try to convert to number if it's a numeric display type
      const displayType = attributes[index].display_type;
      if (displayType === 'boost_number' || displayType === 'boost_percentage' || displayType === 'number') {
        const numValue = parseFloat(newValue);
        if (!isNaN(numValue)) {
          newAttributes[index] = { ...newAttributes[index], [field]: numValue };
        } else {
          newAttributes[index] = { ...newAttributes[index], [field]: newValue };
        }
      } else {
        newAttributes[index] = { ...newAttributes[index], [field]: newValue };
      }
    } else if (field === 'display_type' && newValue === 'text') {
      // Remove display_type field when it's set to text (default)
      const { display_type, ...rest } = newAttributes[index];
      newAttributes[index] = rest;
    } else {
      newAttributes[index] = { ...newAttributes[index], [field]: newValue };
    }

    setAttributes(newAttributes);
    onChange({
      erc721: {
        ...value.erc721,
        attributes: newAttributes
      }
    });
  };

  const addAttribute = () => {
    if (readOnly) return;

    const newAttribute: Attribute = {
      trait_type: '',
      value: '',
    };
    const newAttributes = [...attributes, newAttribute];
    setAttributes(newAttributes);
    onChange({
      erc721: {
        ...value.erc721,
        attributes: newAttributes
      }
    });
  };

  const removeAttribute = (index: number) => {
    if (readOnly) return;

    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
    onChange({
      erc721: {
        ...value.erc721,
        attributes: newAttributes
      }
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={value.erc721?.name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
            placeholder="Token name"
            disabled={readOnly}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={value.erc721?.description ?? ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
            placeholder="Token description"
            className="min-h-[100px]"
            disabled={readOnly}
          />
        </div>

        <div>
          <Label htmlFor="external_url">External URL</Label>
          <Input
            id="external_url"
            type="url"
            value={value.erc721?.external_url || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('external_url', e.target.value)}
            placeholder="https://example.com"
            disabled={readOnly}
          />
        </div>

        <div>
          <Label htmlFor="image">Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="image"
              type="url"
              value={value.erc721?.image || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('image', e.target.value)}
              placeholder="https://example.com/image.png"
              disabled={readOnly}
            />
            {!readOnly && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsImagePickerOpen(true)}
                className="shrink-0"
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}
          </div>
          {value.erc721?.image && (
            <div className="mt-2 rounded-lg border overflow-hidden">
              <img
                src={value.erc721.image}
                alt="Token preview"
                className="w-full h-48 object-contain bg-black/5"
              />
            </div>
          )}
        </div>

        <div>
          <Label>Attributes</Label>
          <div className="space-y-3 mt-2">
            {attributes.map((attr, index) => (
              <Card key={index}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Label>Trait Type</Label>
                      <Input
                        value={attr.trait_type}
                        onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
                        placeholder="Background, Eyes, etc."
                        disabled={readOnly}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Value</Label>
                      <Input
                        value={attr.value.toString()}
                        onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                        placeholder="Blue, Rare, etc."
                        disabled={readOnly}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Display Type</Label>
                      <Select
                        value={attr.display_type || 'text'}
                        onValueChange={(value: string) => handleAttributeChange(index, 'display_type', value)}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text (default)</SelectItem>
                          <SelectItem value="boost_number">Boost Number</SelectItem>
                          <SelectItem value="boost_percentage">Boost Percentage</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={() => removeAttribute(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {!readOnly && (
              <Button
                variant="outline"
                className="w-full"
                onClick={addAttribute}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Attribute
              </Button>
            )}
          </div>
        </div>
      </div>

      <ImagePickerDialog
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onImageUploaded={(imageUrl) => {
          handleChange('image', imageUrl);
          setIsImagePickerOpen(false);
        }}
        item={item}
      />
    </div>
  );
} 
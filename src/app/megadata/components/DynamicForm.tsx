import React, { useCallback, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ImagePickerDialog } from './ImagePickerDialog';

export interface DynamicFormProps {
  schema: Record<string, any>;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  readOnly?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ schema, value, onChange, readOnly }) => {

  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imageFieldPath, setImageFieldPath] = useState<string | null>(null);

  const handleChange = useCallback((field: string, newValue: any) => {
    onChange({ ...value, [field]: newValue });
  }, [value, onChange]);

  const renderField = (field: string, fieldSchema: any) => {
    const isRequired = schema.required?.includes(field);
    const label = fieldSchema.title || field;
    const id = `form-field-${field}`;

    switch (fieldSchema.type) {
      case 'string':
        // Use Textarea for longer descriptions or specific formats
        const useTextarea = fieldSchema.format === 'textarea' || field.toLowerCase().includes('description');
        return (
          <div key={field} className="mb-6"> {/* Increased margin bottom */}
            <Label htmlFor={id} className="mb-2 block"> {/* Added margin bottom to label */}
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {useTextarea ? (
              <Textarea
                id={id}
                value={value[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                readOnly={readOnly}
                placeholder={fieldSchema.description || `Enter ${label}`}
                rows={3}
              />
            ) : (
              <Input
                id={id}
                type={fieldSchema.format === 'url' ? 'url' : 'text'} // Handle URL type
                value={value[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                readOnly={readOnly}
                placeholder={fieldSchema.description || `Enter ${label}`}
              />
            )}
            {/* Optional: Add description text below field */}
            {fieldSchema.description && !fieldSchema.placeholder && (
               <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
            )}
          </div>
        );
      case 'number':
      case 'integer':
        return (
          <div key={field} className="mb-6">
            <Label htmlFor={id} className="mb-2 block">
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={id}
              type="number"
              value={value[field] || ''} // Keep as string for input control, conversion happens on save/validation
              onChange={(e) => handleChange(field, e.target.value === '' ? undefined : Number(e.target.value))}
              readOnly={readOnly}
              placeholder={fieldSchema.description || `Enter ${label}`}
            />
            {fieldSchema.description && !fieldSchema.placeholder && (
               <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
            )}
          </div>
        );
      case 'boolean':
        return (
          <div key={field} className="flex items-center space-x-2 mb-6">
             <Checkbox 
                id={id}
                checked={!!value[field]}
                onCheckedChange={(checked) => handleChange(field, checked)}
                disabled={readOnly}
              />
            <Label htmlFor={id}>
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
             {fieldSchema.description && (
               <p className="text-sm text-muted-foreground">({fieldSchema.description})</p>
            )}
          </div>
        );
      case 'array':
        if (fieldSchema.items?.type === 'object') {
          const items = value[field] || [];
          const itemSchema = fieldSchema.items;
          return (
            <div key={field} className="mb-6">
              <Label className="mb-2 block font-medium">{label}</Label>
              {fieldSchema.description && (
                <p className="text-sm text-muted-foreground mb-3">{fieldSchema.description}</p>
              )}
              <div className="space-y-4">
                {items.map((item: any, index: number) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="pt-6"> {/* Add padding top */}
                       <div className="space-y-4"> {/* Inner spacing for fields */}
                        {Object.keys(itemSchema.properties).map((itemField) => (
                          renderField(`${field}[${index}].${itemField}`, itemSchema.properties[itemField])
                        ))}
                      </div>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-4 text-destructive hover:text-destructive hover:bg-destructive/10" // Destructive styling
                          onClick={() => {
                            const newItems = [...items];
                            newItems.splice(index, 1);
                            handleChange(field, newItems);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {!readOnly && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    const newItem: Record<string, any> = {};
                    // Initialize new item with default values based on itemSchema
                    Object.keys(itemSchema.properties).forEach(prop => {
                        // Basic default initialization, could be expanded
                        newItem[prop] = itemSchema.properties[prop].default !== undefined 
                          ? itemSchema.properties[prop].default 
                          : itemSchema.properties[prop].type === 'array' ? [] 
                          : itemSchema.properties[prop].type === 'boolean' ? false
                          : ''; 
                    });
                    handleChange(field, [...items, newItem]);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add {itemSchema.title || field}
                </Button>
              )}
            </div>
          );
        }
        // Handle arrays of simple types (string, number) if needed
        return null;
        
       case 'object': // Handle nested objects if needed directly
         // You might render nested fields recursively or within a Card
         return (
           <div key={field} className="mb-6 p-4 border rounded-md bg-muted/50">
              <Label className="mb-3 block font-medium">{label}</Label>
              {fieldSchema.description && (
                <p className="text-sm text-muted-foreground mb-3">{fieldSchema.description}</p>
              )}
              <div className="space-y-4"> {/* Inner spacing for fields */}
                 {Object.keys(fieldSchema.properties).map((nestedField) => (
                    renderField(`${field}.${nestedField}`, fieldSchema.properties[nestedField])
                 ))}
              </div>
           </div>
         );

      default:
        return null;
    }
  };

  // Special handling for complex nested field updates (like arrays of objects)
  const handleNestedChange = useCallback((nestedPath: string, newValue: any) => {
    const pathParts = nestedPath.match(/(\w+)|\[(\d+)\]/g);
    if (!pathParts) return;

    const updatedValue = JSON.parse(JSON.stringify(value)); // Deep copy
    let currentLevel = updatedValue;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const arrayMatch = part.match(/\[(\d+)\]/);
      if (arrayMatch) {
        currentLevel = currentLevel[parseInt(arrayMatch[1], 10)];
      } else {
        currentLevel = currentLevel[part];
      }
      // Initialize path if it doesn't exist (e.g., for newly added array items)
      if (currentLevel === undefined) {
           // This part might need refinement depending on how new items are added
           console.error("Trying to set property on undefined path part:", part);
           return; 
      }
    }

    const lastPart = pathParts[pathParts.length - 1];
    const lastArrayMatch = lastPart.match(/\[(\d+)\]/);
    if (lastArrayMatch) {
      currentLevel[parseInt(lastArrayMatch[1], 10)] = newValue; 
    } else {
      currentLevel[lastPart] = newValue;
    }

    onChange(updatedValue);
  }, [value, onChange]);

  // Update renderField for array/object to use handleNestedChange
  const renderFieldRevised = (field: string, fieldSchema: any, pathPrefix = '') => {
    const currentPath = pathPrefix ? `${pathPrefix}.${field}` : field;
    const isRequired = schema.required?.includes(field);
    const label = fieldSchema.title || field;
    const id = `form-field-${currentPath.replace(/\W/g, '_')}`;
    const currentValue = pathPrefix ? getNestedValue(value, currentPath) : value[field];

    // Special handling for the 'image' field
    if (field === 'image' && fieldSchema.type === 'string' && !pathPrefix) { // Only handle top-level image for now
        return (
            <div key={currentPath} className="mb-6">
                <Label htmlFor={id} className="mb-2 block">
                    {label}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <div className="flex items-center space-x-2">
                    <Input
                        id={id}
                        type="url" 
                        value={currentValue || ''}
                        readOnly // Display only
                        placeholder="No image uploaded"
                        className="flex-grow"
                    />
                    {!readOnly && (
                      currentValue ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setImageFieldPath(currentPath);
                            setIsImagePickerOpen(true);
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" /> Change Image
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="default" // More prominent for initial upload
                          onClick={() => {
                            setImageFieldPath(currentPath);
                            setIsImagePickerOpen(true);
                          }}
                        >
                           <Upload className="mr-2 h-4 w-4" /> Upload New Image
                        </Button>
                      )
                    )}
                </div>
                {fieldSchema.description && (
                   <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
                )}
            </div>
        );
    }

    switch (fieldSchema.type) {
      case 'string':
        const useTextarea = fieldSchema.format === 'textarea' || field.toLowerCase().includes('description');
        return (
          <div key={currentPath} className="mb-6">
            <Label htmlFor={id} className="mb-2 block">
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {useTextarea ? (
              <Textarea
                id={id}
                value={currentValue || ''}
                onChange={(e) => handleNestedChange(currentPath, e.target.value)}
                readOnly={readOnly}
                placeholder={fieldSchema.description || `Enter ${label}`}
                rows={3}
              />
            ) : (
              <Input
                id={id}
                type={fieldSchema.format === 'url' ? 'url' : 'text'} 
                value={currentValue || ''}
                onChange={(e) => handleNestedChange(currentPath, e.target.value)}
                readOnly={readOnly}
                placeholder={fieldSchema.description || `Enter ${label}`}
              />
            )}
            {fieldSchema.description && !fieldSchema.placeholder && (
               <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
            )}
          </div>
        );
      case 'number':
      case 'integer':
         return (
          <div key={currentPath} className="mb-6">
            <Label htmlFor={id} className="mb-2 block">
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={id}
              type="number"
              value={currentValue || ''} 
              onChange={(e) => handleNestedChange(currentPath, e.target.value === '' ? undefined : Number(e.target.value))}
              readOnly={readOnly}
              placeholder={fieldSchema.description || `Enter ${label}`}
            />
             {fieldSchema.description && !fieldSchema.placeholder && (
               <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
            )}
          </div>
        );
      case 'boolean':
        return (
          <div key={currentPath} className="flex items-center space-x-2 mb-6">
             <Checkbox 
                id={id}
                checked={!!currentValue}
                onCheckedChange={(checked) => handleNestedChange(currentPath, checked)}
                disabled={readOnly}
              />
            <Label htmlFor={id}>
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
             {fieldSchema.description && (
               <p className="text-sm text-muted-foreground">({fieldSchema.description})</p>
            )}
          </div>
        );
      case 'array':
        if (fieldSchema.items?.type === 'object') {
          const items = currentValue || [];
          const itemSchema = fieldSchema.items;
          return (
            <div key={currentPath} className="mb-6">
              <Label className="mb-2 block font-medium text-lg">{label}</Label> {/* Larger label for array section */}
              {fieldSchema.description && (
                <p className="text-sm text-muted-foreground mb-3">{fieldSchema.description}</p>
              )}
              <div className="space-y-4">
                {items.map((item: any, index: number) => {
                  const itemPath = `${currentPath}[${index}]`;
                  return (
                  <Card key={itemPath} className="bg-muted/50 overflow-hidden"> {/* Added overflow-hidden */}
                     <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-background border-b"> {/* Card Header */}
                       <CardTitle className="text-base font-medium">
                         {itemSchema.title || field} #{index + 1}
                       </CardTitle>
                       {!readOnly && (
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" // Destructive styling
                           onClick={() => {
                             const newItems = [...items];
                             newItems.splice(index, 1);
                             handleNestedChange(currentPath, newItems);
                           }}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       )}
                     </CardHeader>
                    <CardContent className="p-4"> {/* Adjusted padding */}
                       <div className="space-y-4">
                        {Object.keys(itemSchema.properties).map((itemField) => (
                          renderFieldRevised(itemField, itemSchema.properties[itemField], itemPath)
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
              {!readOnly && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    const newItem: Record<string, any> = {};
                    Object.keys(itemSchema.properties).forEach(prop => {
                        newItem[prop] = itemSchema.properties[prop].default !== undefined 
                          ? itemSchema.properties[prop].default 
                          : itemSchema.properties[prop].type === 'array' ? [] 
                          : itemSchema.properties[prop].type === 'boolean' ? false
                          : ''; 
                    });
                    handleNestedChange(currentPath, [...items, newItem]);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add {itemSchema.title || field}
                </Button>
              )}
            </div>
          );
        }
        return null;
        
       case 'object':
         return (
           <div key={currentPath} className="mb-6 p-4 border rounded-md bg-muted/50">
              <Label className="mb-3 block font-medium text-base">{label}</Label> {/* Consistent label size */}
              {fieldSchema.description && (
                <p className="text-sm text-muted-foreground mb-3">{fieldSchema.description}</p>
              )}
              <div className="space-y-4">
                 {Object.keys(fieldSchema.properties).map((nestedField) => (
                    renderFieldRevised(nestedField, fieldSchema.properties[nestedField], currentPath)
                 ))}
              </div>
           </div>
         );

      default:
        return null;
    }
  };

  // Helper to get nested value (basic implementation)
  const getNestedValue = (obj: Record<string, any>, path: string): any => {
    const parts = path.match(/(\w+)|\[(\d+)\]/g);
    if (!parts) return undefined;
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        const arrayMatch = part.match(/\[(\d+)\]/);
        if (arrayMatch) {
            current = current[parseInt(arrayMatch[1], 10)];
        } else {
            current = current[part];
        }
    }
    return current;
  };


  return (
    <div className="space-y-6 p-4"> {/* Add padding to the main container */}
      {Object.keys(schema.properties || {}).map((field) => (
        renderFieldRevised(field, schema.properties[field])
      ))}

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        isOpen={isImagePickerOpen}
        onClose={() => {
            setIsImagePickerOpen(false);
            setImageFieldPath(null); // Reset path on close
        }}
        onImageUploaded={(imageUrl) => {
          if (imageFieldPath) {
            handleNestedChange(imageFieldPath, imageUrl);
          }
          setIsImagePickerOpen(false);
          setImageFieldPath(null); // Reset path after upload
        }}
      />
    </div>
  );
};

export default DynamicForm; 
import React, { useCallback, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePickerDialog } from './FilePickerDialog';

export interface DynamicFormProps {
  schema: Record<string, any>;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  readOnly?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ schema, value, onChange, readOnly }) => {

  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [fileFieldPath, setFileFieldPath] = useState<string | null>(null);
  const [filePickerConfig, setFilePickerConfig] = useState<{ accept?: string; maxSize?: number; description?: string }>({});

  const handleChange = useCallback((field: string, newValue: any) => {
    onChange({ ...value, [field]: newValue });
  }, [value, onChange]);

  // Utility to humanize property names (e.g., external_url -> External URL)
  function humanize(str: string): string {
    return str
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  }

  const renderField = (field: string, fieldSchema: any) => {
    const isRequired = schema.required?.includes(field);
    const label = fieldSchema.title || field;
    const id = `form-field-${field}`;

    switch (fieldSchema.type) {
      case 'string':
        const useTextarea = fieldSchema.format === 'textarea' || field.toLowerCase().includes('description');
        return (
          <div key={field} className="mb-6">
            <Label htmlFor={id} className="mb-2 block text-base font-medium text-primary">
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
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            ) : (
              <Input
                id={id}
                type={fieldSchema.format === 'url' ? 'url' : 'text'}
                value={value[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                readOnly={readOnly}
                placeholder={fieldSchema.description || `Enter ${label}`}
                className="bg-background/50 border-border/50 focus:border-primary/50"
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
          <div key={field} className="mb-6">
            <Label htmlFor={id} className="mb-2 block text-base font-medium text-primary">
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={id}
              type="number"
              value={value[field] || ''}
              onChange={(e) => handleChange(field, e.target.value === '' ? undefined : Number(e.target.value))}
              readOnly={readOnly}
              placeholder={fieldSchema.description || `Enter ${label}`}
              className="bg-background/50 border-border/50 focus:border-primary/50"
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
              className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor={id} className="text-base font-medium text-primary">
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
              <Label className="mb-2 block text-base font-medium text-primary">{label}</Label>
              {fieldSchema.description && (
                <p className="text-sm text-muted-foreground mb-3">{fieldSchema.description}</p>
              )}
              <div className="space-y-4">
                {items.map((item: any, index: number) => (
                  <Card key={index} className="bg-background/50 border-border/50 shadow-sm">
                    <CardHeader className="border-b border-border/50 py-3 px-4">
                      <CardTitle className="text-sm font-medium text-primary">
                        {itemSchema.title || field} #{index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {Object.keys(itemSchema.properties).map((itemField) => (
                          renderField(`${field}[${index}].${itemField}`, itemSchema.properties[itemField])
                        ))}
                      </div>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-4 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  className="mt-4 border-primary/50 text-primary hover:bg-primary/5"
                  onClick={() => {
                    const newItem: Record<string, any> = {};
                    Object.keys(itemSchema.properties).forEach(prop => {
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
        return null;
        
      case 'object':
        return (
          <div key={field} className="mb-6 p-4 border rounded-md bg-muted/50 border-border/50">
            <Label htmlFor={id + "-group"} className="mb-3 block text-base font-medium text-primary">{label}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground mb-3">{fieldSchema.description}</p>
            )}
            <div id={id + "-group"} className="space-y-4">
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

  // Helper to parse maxSize string like '10MB', '500KB', or number
  function parseMaxSize(maxSize?: string | number): number | undefined {
    if (!maxSize) return undefined;
    if (typeof maxSize === 'number') return maxSize;
    const str = maxSize.trim().toLowerCase();
    if (str.endsWith('mb')) return parseInt(str) * 1024 * 1024;
    if (str.endsWith('kb')) return parseInt(str) * 1024;
    return parseInt(str);
  }

  // Update renderField for array/object to use handleNestedChange
  const renderFieldRevised = (field: string, fieldSchema: any, pathPrefix = '') => {
    const currentPath = pathPrefix ? `${pathPrefix}.${field}` : field;
    const isRequired = pathPrefix 
        ? getNestedSchema(schema, pathPrefix)?.required?.includes(field)
        : schema.required?.includes(field);
        
    // Use humanized label
    const label = fieldSchema.title || humanize(field);
    const id = `form-field-${currentPath.replace(/\W/g, '_')}`;
    const currentValue = getNestedValue(value, currentPath);

    // Special handling for the 'x-upload' field
    if (fieldSchema['x-upload']) {
      const xUpload = fieldSchema['x-upload'];
      return (
        <div key={currentPath} className="mb-6">
          <Label htmlFor={id} className="mb-2 block text-base font-semibold text-primary">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id={id}
              type="url"
              value={currentValue || ''}
              onChange={e => handleNestedChange(currentPath, e.target.value)}
              readOnly={readOnly}
              placeholder={fieldSchema.description || xUpload.description || `Enter or upload ${label}`}
              className="flex-grow focus:ring-primary/30 transition-colors"
            />
            {!readOnly && (
              <Button
                type="button"
                variant={currentValue ? 'outline' : 'default'}
                onClick={() => {
                  setFileFieldPath(currentPath);
                  setFilePickerConfig({
                    accept: xUpload.accept,
                    maxSize: parseMaxSize(xUpload.maxSize),
                    description: xUpload.description,
                  });
                  setFilePickerOpen(true);
                }}
              >
                <Upload className="mr-2 h-4 w-4" /> {currentValue ? 'Change File' : 'Upload File'}
              </Button>
            )}
          </div>
          {fieldSchema.description && (
            <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    // Handle 'oneOf' - Render based on the first applicable type
    if (fieldSchema.oneOf) { 
        // Simple approach: Find the first primitive type (string, number, boolean) 
        // in the oneOf array and render an input for that.
        // A more robust UI might allow the user to select the desired type.
        const firstPrimitiveSchema = fieldSchema.oneOf.find((s: any) => 
            ['string', 'number', 'integer', 'boolean'].includes(s.type)
        );

        if (firstPrimitiveSchema) {
            // Determine input type based on the found schema
             let inputType = 'text';
             let inputMode: React.HTMLAttributes<HTMLInputElement>['inputMode'] = 'text';
             let step: string | undefined = undefined;

             if (firstPrimitiveSchema.type === 'number' || firstPrimitiveSchema.type === 'integer') {
                 inputType = 'number';
                 inputMode = 'decimal';
                 step = firstPrimitiveSchema.type === 'integer' ? '1' : 'any';
             } else if (firstPrimitiveSchema.type === 'boolean') {
                 // Render Checkbox for boolean within oneOf
                 return (
                      <div key={currentPath} className="flex items-center space-x-2 mb-6">
                         <Checkbox 
                             id={id}
                             checked={!!currentValue} // Coerce to boolean
                             onCheckedChange={(checked) => handleNestedChange(currentPath, checked)}
                             disabled={readOnly}
                         />
                         <Label htmlFor={id} className="cursor-pointer">
                             {label} (Select Type: Boolean)
                             {isRequired && <span className="text-red-500 ml-1">*</span>}
                         </Label>
                         {fieldSchema.description && (
                             <p className="text-sm text-muted-foreground ml-2">({fieldSchema.description})</p>
                         )}
                     </div>
                 );
             }

            // Render Input for string or number/integer
            return (
                <div key={currentPath} className="mb-6">
                    <Label htmlFor={id} className="mb-2 block">
                        {label} 
                        {/* Add type hint if multiple primitives? (e.g., "(Text or Number)") */} 
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                        id={id}
                        type={inputType}
                        inputMode={inputMode}
                        step={step}
                        value={currentValue ?? ''} // Handle undefined/null
                        onChange={(e) => {
                            let val: any = e.target.value;
                            if (inputType === 'number') {
                                val = val === '' ? undefined : Number(val);
                            }
                            handleNestedChange(currentPath, val);
                        }}
                        readOnly={readOnly}
                        placeholder={fieldSchema.description || `Enter ${label}`}
                        className="focus:ring-primary/30 transition-colors"
                    />
                    {fieldSchema.description && !fieldSchema.placeholder && (
                        <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
                    )}
                </div>
            );
        } 
        
        // Fallback if no primitive type found in oneOf or complex types
        console.warn(`Unhandled 'oneOf' scenario for field ${currentPath}. Contains non-primitive types or is empty.`);
        return <div key={currentPath} className="text-orange-500">Complex 'oneOf' field "{label}" cannot be rendered directly.</div>;
    }

    // Handle 'enum' - Render a Select component
    if (fieldSchema.enum && fieldSchema.type === 'string') {
         return (
            <div key={currentPath} className="mb-6">
                 <Label htmlFor={id} className="mb-2 block">
                     {label}
                     {isRequired && <span className="text-red-500 ml-1">*</span>}
                 </Label>
                 <Select
                     value={currentValue || ''}
                     onValueChange={(val) => handleNestedChange(currentPath, val === 'none' ? undefined : val)} // Handle 'none' selection
                     disabled={readOnly}
                 >
                     <SelectTrigger id={id} className="w-full">
                         <SelectValue placeholder={fieldSchema.description || `Select ${label}`} />
                     </SelectTrigger>
                     <SelectContent>
                         {/* Optional: Add a 'None' option if the field is not required */}
                         {!isRequired && <SelectItem value="none">None</SelectItem>}
                         {fieldSchema.enum.map((option: string) => (
                             <SelectItem key={option} value={option}>
                                 {option}
                             </SelectItem>
                         ))}
                     </SelectContent>
                 </Select>
                 {fieldSchema.description && !fieldSchema.placeholder && (
                     <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
                 )}
            </div>
         );
    }

    switch (fieldSchema.type) {
      case 'string':
        const useTextarea = fieldSchema.format === 'textarea' || field.toLowerCase().includes('description');
        // Determine placeholder
        let placeholder = '';
        if (
          fieldSchema.placeholder &&
          fieldSchema.placeholder !== label &&
          fieldSchema.placeholder !== fieldSchema.description
        ) {
          placeholder = fieldSchema.placeholder;
        } else if (
          fieldSchema.example &&
          fieldSchema.example !== label &&
          fieldSchema.example !== fieldSchema.description
        ) {
          placeholder = fieldSchema.example;
        } else if (
          fieldSchema.description &&
          fieldSchema.description !== label
        ) {
          placeholder = '';
        } else {
          placeholder = '';
        }
        return (
          <div key={currentPath} className="mb-8">
            <Label htmlFor={id} className="mb-2 block text-base font-semibold text-primary">
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {useTextarea ? (
              <Textarea
                className="bg-background/10 border-border focus:border-primary/50"
                id={id}
                value={currentValue || ''}
                onChange={(e) => handleNestedChange(currentPath, e.target.value)}
                readOnly={readOnly}
                placeholder={placeholder}
                rows={3}
              />
            ) : (
              <Input
                className="bg-background/10 border-border focus:border-primary/50"
                id={id}
                type={fieldSchema.format === 'url' ? 'url' : 'text'}
                value={currentValue || ''}
                onChange={(e) => handleNestedChange(currentPath, e.target.value)}
                readOnly={readOnly}
                placeholder={placeholder}
              />
            )}
            {fieldSchema.description && (
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
              className="focus:ring-primary/30 transition-colors"
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
                  <Card key={itemPath} className="overflow-hidden"> {/* Added overflow-hidden */}
                    <CardContent className="px-4"> {/* Adjusted padding */}
                       <div className="space-y-2">
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
              <Label htmlFor={id + "-group"} className="mb-3 block font-medium text-base">{label}</Label> 
              {fieldSchema.description && (
                <p className="text-sm text-muted-foreground mb-3">{fieldSchema.description}</p>
              )}
              <div id={id + "-group"} className="space-y-4"> 
                 {Object.keys(fieldSchema.properties).map((nestedField) => (
                    renderFieldRevised(nestedField, fieldSchema.properties[nestedField], currentPath)
                 ))}
              </div>
           </div>
         );

      default:
         // Log unhandled types if necessary
         console.warn(`Unhandled field type "${fieldSchema.type}" for field: ${currentPath}`);
        return null;
    }
  };

  // Helper to get nested value (basic implementation)
  const getNestedValue = (obj: Record<string, any>, path: string): any => {
    // Match words or array indices like [0], [1], etc.
    const parts = path.match(/[^.[\]]+|\[\d+\]/g); 
    if (!parts) return undefined;
    
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        const arrayMatch = part.match(/^\[(\d+)\]$/); // Match only if the whole part is an index
        if (arrayMatch) {
            const index = parseInt(arrayMatch[1], 10);
             // Check if the current level is an array and the index is valid
            if (Array.isArray(current) && index >= 0 && index < current.length) {
                 current = current[index];
            } else {
                // Handle cases where the path is incorrect or the data structure doesn't match
                console.warn(`Cannot access index ${index} in path ${path}. Current part:`, current);
                 return undefined; 
            }
        } else {
             // Access object property
             // Check if the current level is an object and has the property
             if (typeof current === 'object' && current !== null && part in current) {
                 current = current[part];
             } else {
                  // Handle cases where the path is incorrect or the data structure doesn't match
                 console.warn(`Cannot access property "${part}" in path ${path}. Current part:`, current);
                 return undefined;
             }
        }
    }
    return current;
  };

  // Helper function to get nested schema definition (basic)
  const getNestedSchema = (baseSchema: any, path: string): any => {
      const parts = path.match(/[^.[\]]+|\[\d+\]/g);
      if (!parts) return undefined;
      
      let currentSchema = baseSchema;
      for (const part of parts) {
          if (!currentSchema || !currentSchema.properties) return undefined; // Path doesn't exist in schema

          const arrayMatch = part.match(/^\[(\d+)\]$/);
          if (arrayMatch) {
               // If it's an array index, we expect the current schema part to be an array with items
               if (currentSchema.type === 'array' && currentSchema.items) {
                   currentSchema = currentSchema.items; // Move to the item schema for the next part
               } else {
                   return undefined; // Path part is index, but schema isn't array or has no items
               }
           } else {
               // If it's a property name, move into that property's schema
                if (currentSchema.properties && currentSchema.properties[part]) {
                    currentSchema = currentSchema.properties[part];
                } else {
                    return undefined; // Property doesn't exist in schema
                }
           }
       }
       return currentSchema;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/80 border border-border/40 rounded-2xl shadow-lg p-8 space-y-10">
      {/* Section Title */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-serif font-bold text-primary mb-2 tracking-tight">Metadata Properties</h2>
        <p className="text-lg text-muted-foreground">Define the properties and metadata for your token</p>
      </div>
      <div className="space-y-8">
        {Object.keys(schema.properties || {}).map((field, idx, arr) => (
          <div key={field} className="relative">
            {renderFieldRevised(field, schema.properties[field])}
            {/* Divider between major fields, except last */}
            {idx < arr.length - 1 && <div className="absolute left-0 right-0 -bottom-4 h-px bg-border/30" />}
          </div>
        ))}
      </div>

      {/* File Picker Dialog */}
      <FilePickerDialog
        isOpen={filePickerOpen}
        onClose={() => {
            setFilePickerOpen(false);
            setFileFieldPath(null);
            setFilePickerConfig({});
        }}
        onFileUploaded={fileUrl => {
          if (fileFieldPath) {
            handleNestedChange(fileFieldPath, fileUrl);
          }
          setFilePickerOpen(false);
          setFileFieldPath(null);
          setFilePickerConfig({});
        }}
        accept={filePickerConfig.accept}
        maxSize={filePickerConfig.maxSize}
        description={filePickerConfig.description}
      />
    </div>
  );
};

export default DynamicForm; 
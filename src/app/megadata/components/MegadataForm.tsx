import React from 'react';
import DynamicForm from './DynamicForm';

export interface MegadataFormProps {
  schema?: Record<string, any>;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  readOnly?: boolean;
}

export const MegadataForm: React.FC<MegadataFormProps> = ({ 
  schema, 
  value, 
  onChange, 
  readOnly 
}) => {
  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No module schema available for this collection.
      </div>
    );
  }

  return (
    <DynamicForm
      schema={schema}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
    />
  );
};

export default MegadataForm; 
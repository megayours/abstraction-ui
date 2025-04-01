import { useEffect, useState, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { validateMegadata } from '../../utils/validation';
import megadataSchema from './megadata.schema.json';

interface JsonEditorProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}

export default function JsonEditor({ value, onChange }: JsonEditorProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const { errors } = validateMegadata(value);
    setValidationErrors(errors);
  }, [value]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure JSON schema validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: "megadata.schema.json",
        fileMatch: ["*"],
        schema: megadataSchema
      }],
      enableSchemaRequest: false
    });

    // Create and set the model
    const modelUri = monaco.Uri.parse("inmemory://model.json");
    const model = monaco.editor.createModel(
      JSON.stringify(value, null, 2),
      "json",
      modelUri
    );

    editor.setModel(model);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;

    try {
      const parsed = JSON.parse(value);
      const { isValid, errors } = validateMegadata(parsed);
      setValidationErrors(errors);
      if (isValid) {
        onChange(parsed);
      }
    } catch (error) {
      setValidationErrors(['Invalid JSON format']);
    }
  };

  return (
    <div className="relative h-full">
      <MonacoEditor
        height="100%"
        defaultLanguage="json"
        value={JSON.stringify(value, null, 2)}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true
        }}
      />
      {validationErrors.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-50 border-t border-red-200 p-2">
          <div className="text-sm text-red-600">
            {validationErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
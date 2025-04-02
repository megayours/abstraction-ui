import { useEffect, useState, useRef, useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { validateMegadata } from '../../utils/validation';
import megadataSchema from './megadata.schema.json';

interface JsonEditorProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  readOnly?: boolean;
}

export default function JsonEditor({ value, onChange, readOnly = false }: JsonEditorProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const editorRef = useRef<any>(null);
  const modelRef = useRef<any>(null);

  // Memoize the JSON string to prevent unnecessary updates
  const jsonString = useMemo(() => JSON.stringify(value, null, 2), [value]);

  useEffect(() => {
    const { errors } = validateMegadata(value);
    setValidationErrors(errors);
  }, [value]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure JSON schema validation only once
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: "megadata.schema.json",
        fileMatch: ["*"],
        schema: megadataSchema
      }],
      enableSchemaRequest: false
    });

    // Create and set the model only once
    const modelUri = monaco.Uri.parse("inmemory://model.json");
    modelRef.current = monaco.editor.createModel(
      jsonString,
      "json",
      modelUri
    );

    editor.setModel(modelRef.current);
  };

  // Update model content when value changes
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.setValue(jsonString);
    }
  }, [jsonString]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value || readOnly) return;

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
        value={jsonString}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          readOnly,
          // Add performance optimizations
          renderWhitespace: 'none',
          renderLineHighlight: 'none',
          renderValidationDecorations: 'off',
          // Disable features we don't need
          folding: false,
          foldingStrategy: 'indentation',
          showFoldingControls: 'never',
          unfoldOnClickAfterEndOfLine: false,
          // Optimize for large files
          largeFileOptimizations: true,
          maxTokenizationLineLength: 20000
        }}
      />
      {validationErrors.length > 0 && !readOnly && (
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
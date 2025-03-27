import dynamic from 'next/dynamic';
import { useRef } from 'react';
import megadataSchema from '../schemas/megadata.schema.json';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false
});

interface JsonEditorProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}

export default function JsonEditor({ value, onChange }: JsonEditorProps) {
  const editorRef = useRef<any>(null);

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
      onChange(parsed);
    } catch {
      // Don't update if JSON is invalid
    }
  };

  return (
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        defaultLanguage="json"
        value={JSON.stringify(value, null, 2)}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true
        }}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
      />
    </div>
  );
} 
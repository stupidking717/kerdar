import { memo, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useThemeMode } from '../../store/theme-store';
import { ThemeMode } from '../../types';
import { cn } from '../../utils/cn';

// Monaco types (imported dynamically)
type MonacoEditor = Parameters<OnMount>[0];
type Monaco = Parameters<OnMount>[1];

/**
 * Props for CodeEditor component
 */
export interface CodeEditorProps {
  /** The code value */
  value: string;
  /** Called when code changes */
  onChange: (value: string) => void;
  /** Programming language (javascript, typescript, json, python, etc.) */
  language?: string;
  /** Height of the editor */
  height?: string | number;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Additional class names */
  className?: string;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Show minimap */
  minimap?: boolean;
  /** Font size */
  fontSize?: number;
}

/**
 * CodeEditor component - Monaco-based code editor with syntax highlighting
 */
export const CodeEditor = memo<CodeEditorProps>(({
  value,
  onChange,
  language = 'javascript',
  height = '300px',
  readOnly = false,
  placeholder,
  className,
  lineNumbers = true,
  minimap = false,
  fontSize = 13,
}) => {
  const mode = useThemeMode();

  const isDark = mode === ThemeMode.Dark ||
    (mode === ThemeMode.System &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    onChange(newValue ?? '');
  }, [onChange]);

  const handleEditorMount: OnMount = useCallback((editor: MonacoEditor, monaco: Monaco) => {
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: minimap },
      lineNumbers: lineNumbers ? 'on' : 'off',
      fontSize,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      padding: { top: 8, bottom: 8 },
      renderLineHighlight: 'line',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    });

    // Register custom completions for workflow expressions
    monaco.languages.registerCompletionItemProvider('javascript', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Workflow-specific completions
        const suggestions = [
          {
            label: '$json',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$json',
            documentation: 'Access JSON data from previous node',
            range,
          },
          {
            label: '$input',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$input',
            documentation: 'Access input data',
            range,
          },
          {
            label: '$item',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$item',
            documentation: 'Current item being processed',
            range,
          },
          {
            label: '$node',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$node[""]',
            documentation: 'Access data from a specific node',
            range,
          },
          {
            label: '$workflow',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$workflow',
            documentation: 'Workflow metadata and utilities',
            range,
          },
          {
            label: '$env',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$env',
            documentation: 'Access environment variables',
            range,
          },
          {
            label: '$now',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$now',
            documentation: 'Current timestamp',
            range,
          },
          {
            label: '$today',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$today',
            documentation: 'Today\'s date',
            range,
          },
          {
            label: 'return',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'return {\n  $1\n};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Return data to next node',
            range,
          },
        ];

        return { suggestions };
      },
    });
  }, [minimap, lineNumbers, fontSize]);

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600',
        className
      )}
    >
      <Editor
        height={height}
        language={language}
        value={value || placeholder || ''}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme={isDark ? 'vs-dark' : 'light'}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          lineNumbers: lineNumbers ? 'on' : 'off',
          fontSize,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-slate-800">
            <div className="text-sm text-gray-500">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;

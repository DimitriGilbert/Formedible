"use client";

import React, { useState, useCallback, useMemo } from "react";
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview as SandpackPreviewComponent,
  SandpackConsole,
  SandpackFileExplorer,
  SandpackCodeEditor,
  SandpackFiles,
  SandpackPredefinedTemplate
} from "@codesandbox/sandpack-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  injectFormCodeIntoSandbox,
  validateFormCode,
  createSandboxFiles,
  type SandboxFiles as SandboxFilesType,
  type InjectionOptions
} from "@/lib/sandbox-code-injector";

export interface SandpackPreviewProps {
  /** The generated form code to preview */
  formCode?: string;
  /** Callback when form is submitted in the sandbox */
  onFormSubmit?: (formData: Record<string, unknown>) => void;
  /** Callback when form error occurs in the sandbox */
  onFormError?: (error: Error) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the code editor alongside preview */
  showCodeEditor?: boolean;
  /** Whether to show console output */
  showConsole?: boolean;
  /** Whether to show file explorer */
  showFileExplorer?: boolean;
  /** Template to use for the sandbox */
  template?: SandpackPredefinedTemplate;
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Custom height for the preview */
  height?: string;
  /** Options for code injection */
  injectionOptions?: InjectionOptions;
  /** Whether to show validation status */
  showValidationStatus?: boolean;
  /** Custom styles to inject */
  customStyles?: string;
}

// Default template files for Formedible forms
const DEFAULT_FORMEDIBLE_FILES: SandpackFiles = {
  "/App.tsx": `import React from 'react';
import { createRoot } from 'react-dom/client';
import FormComponent from './FormComponent';
import './styles.css';

function App() {
  const handleFormSubmit = (data: Record<string, unknown>) => {
    console.log('Form submitted:', data);
    
    // Notify parent component if available
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'FORM_SUBMIT',
        data: data
      }, '*');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <FormComponent onSubmit={handleFormSubmit} />
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}`,
  
  "/FormComponent.tsx": `import React from 'react';

interface FormComponentProps {
  onSubmit?: (data: Record<string, unknown>) => void;
}

export default function FormComponent({ onSubmit }: FormComponentProps) {
  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-4">Loading Form...</h2>
      <p className="text-gray-600">
        Your generated form will appear here once the code is processed.
      </p>
    </div>
  );
}`,
  
  "/styles.css": `body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f8f9fa;
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.field-group {
  margin-bottom: 1.5rem;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.field-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.submit-button {
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background-color: #2563eb;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}`,

  "/package.json": `{
  "name": "formedible-preview",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  },
  "main": "/App.tsx"
}`
};

export function SandpackPreview({
  formCode,
  onFormSubmit,
  onFormError,
  className,
  showCodeEditor = false,
  showConsole = false,
  showFileExplorer = false,
  template = "react-ts",
  isLoading = false,
  height = "500px",
  injectionOptions,
  showValidationStatus = true,
  customStyles
}: SandpackPreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [validationStatus, setValidationStatus] = useState<ReturnType<typeof validateFormCode> | null>(null);

  // Create files object with the form code injected using the new utility
  const files = useMemo((): SandpackFiles => {
    if (!formCode) {
      // Return default files when no form code is provided
      return createSandboxFiles("", {
        ...injectionOptions,
        customStyles
      });
    }

    try {
      // Validate the form code first
      const validation = validateFormCode(formCode);
      setValidationStatus(validation);

      if (!validation.isValid) {
        console.warn("Form code validation failed:", validation.errors);
        setError(`Validation failed: ${validation.errors.join(', ')}`);
      } else {
        setError(null);
      }

      // Use the injection utility to create sandbox files
      const baseFiles: SandboxFilesType = {};
      const injectedFiles = injectFormCodeIntoSandbox(
        baseFiles,
        formCode,
        {
          useErrorBoundary: true,
          strictTypeScript: true,
          customStyles,
          ...injectionOptions
        }
      );

      return injectedFiles;
    } catch (err) {
      console.error("Error processing form code:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to process form code: ${errorMessage}`);
      
      // Return fallback files
      return createSandboxFiles("", {
        ...injectionOptions,
        customStyles
      });
    }
  }, [formCode, injectionOptions, customStyles]);

  // Handle initialization complete
  const handleBundlerLoad = useCallback(() => {
    setIsInitializing(false);
    setError(null);
  }, []);

  // Handle runtime errors
  const handleError = useCallback((error: Error) => {
    console.error("Sandpack error:", error);
    setError(error.message);
    setIsInitializing(false);
    onFormError?.(error);
  }, [onFormError]);

  // Handle form submission and error messages from the sandbox
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FORM_SUBMIT' && onFormSubmit) {
        onFormSubmit(event.data.data);
      } else if (event.data?.type === 'FORM_ERROR' && onFormError) {
        const error = new Error(event.data.error || 'Unknown form error');
        onFormError(error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onFormSubmit, onFormError]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)} style={{ height }}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading preview environment...</span>
        </div>
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  // Render validation status if enabled
  const renderValidationStatus = () => {
    if (!showValidationStatus || !validationStatus) return null;

    return (
      <div className="mb-4 p-3 rounded-lg border">
        <div className="flex items-center gap-2 mb-2">
          {validationStatus.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="font-medium text-sm">
            {validationStatus.isValid ? "Code Validated" : "Validation Issues"}
          </span>
        </div>
        
        {validationStatus.errors.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-red-600">Errors:</p>
            {validationStatus.errors.map((error, index) => (
              <p key={index} className="text-xs text-red-600">• {error}</p>
            ))}
          </div>
        )}
        
        {validationStatus.warnings.length > 0 && (
          <div className="space-y-1 mt-2">
            <p className="text-xs font-medium text-yellow-600">Warnings:</p>
            {validationStatus.warnings.map((warning, index) => (
              <p key={index} className="text-xs text-yellow-600">• {warning}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className={cn("space-y-4", className)} style={{ height }}>
        {renderValidationStatus()}
        <Alert className="h-full flex flex-col justify-center">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="mt-2">
            <strong>Preview Error:</strong> {error}
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              The form preview encountered an error. Please check the generated code and try again.
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  try {
    return (
      <div className={cn("w-full overflow-hidden", className)} style={{ minHeight: height }}>
        {renderValidationStatus()}
        <SandpackProvider
          template={template}
          files={files}
          options={{
            bundlerURL: "https://sandpack-bundler.codesandbox.io",
            visibleFiles: showCodeEditor ? ["/FormComponent.tsx", "/App.tsx"] : [],
            activeFile: "/FormComponent.tsx",
            initMode: "lazy",
            autorun: true,
            autoReload: true
          }}
          customSetup={{
            dependencies: {
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "@types/react": "^18.2.0",
              "@types/react-dom": "^18.2.0"
            }
          }}
        >
          <SandpackLayout 
            style={{ height, borderRadius: "8px" }}
            className="border"
          >
            {showFileExplorer && <SandpackFileExplorer />}
            {showCodeEditor && (
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                closableTabs
                wrapContent
              />
            )}
            <SandpackPreviewComponent
              showOpenInCodeSandbox={false}
              showRefreshButton={true}
              showNavigator={false}
              style={{ height: "100%" }}
            />
            {showConsole && (
              <SandpackConsole
                showHeader={true}
                showSyntaxError={true}
                maxMessageCount={100}
                resetOnPreviewRestart={true}
              />
            )}
          </SandpackLayout>
        </SandpackProvider>
      </div>
    );
  } catch (err) {
    console.error("Error rendering Sandpack:", err);
    return (
      <Alert className={cn("h-full flex flex-col justify-center", className)}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Failed to initialize live preview.</strong>
          <br />
          <span className="text-sm text-muted-foreground mt-2 block">
            Please try refreshing or switch to static preview mode.
          </span>
        </AlertDescription>
      </Alert>
    );
  }
}

export default SandpackPreview;
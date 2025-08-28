"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview as SandpackPreviewComponent,
  SandpackConsole,
  SandpackFileExplorer,
  SandpackCodeEditor,
  SandpackFiles,
  SandpackPredefinedTemplate,
  useSandpack
} from "@codesandbox/sandpack-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  Terminal,
  TerminalSquare,
  Eye,
  EyeOff,
  Settings,
  Code2,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  injectFormCodeIntoSandbox,
  validateFormCode,
  createSandboxFiles,
  type SandboxFiles as SandboxFilesType,
  type InjectionOptions
} from "@/lib/sandbox-code-injector";
import {
  getCachedTemplate,
  setCachedTemplate,
  generateCacheKey,
  getCacheStatistics
} from "@/lib/sandbox-cache";
import {
  analyzeFormCode,
  splitFormCode,
  splitResultToSandpackFiles
} from "@/lib/code-splitting-utils";

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
  /** Whether to show the toolbar controls */
  showToolbar?: boolean;
  /** Whether to show loading progress */
  showProgress?: boolean;
  /** Callback when preview is refreshed */
  onRefresh?: () => void;
  /** Callback when CodeSandbox is opened */
  onOpenCodeSandbox?: (sandboxUrl: string) => void;
  /** Whether to enable performance optimizations */
  enablePerformanceMode?: boolean;
  /** Whether to show performance metrics */
  showPerformanceMetrics?: boolean;
  /** Form fields for code splitting analysis */
  formFields?: any[];
  /** Whether to enable code splitting for large forms */
  enableCodeSplitting?: boolean;
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
  height = "100%",
  injectionOptions,
  showValidationStatus = true,
  customStyles,
  showToolbar = true,
  showProgress = true,
  onRefresh,
  onOpenCodeSandbox,
  enablePerformanceMode = true,
  showPerformanceMetrics = false,
  formFields = [],
  enableCodeSplitting = true
}: SandpackPreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [validationStatus, setValidationStatus] = useState<ReturnType<typeof validateFormCode> | null>(null);
  const [consoleVisible, setConsoleVisible] = useState(showConsole);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bundleProgress, setBundleProgress] = useState(0);
  const [bundleStatus, setBundleStatus] = useState<'idle' | 'bundling' | 'success' | 'error'>('idle');
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    cacheHit: boolean;
    loadTime: number;
    splitStrategy: string;
    bundleSize: number;
  } | null>(null);
  const sandpackRef = useRef<any>(null);
  const loadStartTime = useRef<number>(0);

  // Create files object with performance optimizations and caching
  const files = useMemo((): SandpackFiles => {
    loadStartTime.current = performance.now();
    
    if (!formCode) {
      // Return default files when no form code is provided
      return createSandboxFiles("", {
        ...injectionOptions,
        customStyles
      });
    }

    try {
      // Generate cache key for performance optimization
      const cacheKey = enablePerformanceMode 
        ? generateCacheKey(formCode, {
            showCodeEditor,
            showConsole,
            showFileExplorer,
            templateComplexity: injectionOptions?.templateComplexity
          })
        : null;

      // Try to get cached template first (synchronous check)
      let cachedResult: SandpackFiles | null = null;
      if (cacheKey && enablePerformanceMode) {
        // getCachedTemplate is async, but for now we'll skip the cache check in the memoized function
        // and implement proper async caching in a later iteration
        cachedResult = null;
      }

      // Validate the form code first - but don't set state in useMemo
      const validation = validateFormCode(formCode);

      // Analyze form for code splitting if enabled
      let finalFiles: SandpackFiles;
      let splitStrategy = 'none';

      if (enableCodeSplitting && enablePerformanceMode && formFields.length > 0) {
        const analysis = analyzeFormCode(formCode, formFields);
        
        if (analysis.shouldSplit) {
          const splitResult = splitFormCode(formCode, formFields, {
            maxComponentSize: 5000,
            maxFieldsPerChunk: 10,
            enableLazyLoading: true
          });
          
          if (splitResult.chunks.length > 0) {
            // Convert split result to sandbox files
            const splitFiles = splitResultToSandpackFiles(splitResult);
            
            // Merge with base sandbox structure
            const baseFiles = createSandboxFiles("", {
              ...injectionOptions,
              customStyles
            });
            
            finalFiles = { ...baseFiles, ...splitFiles };
            splitStrategy = analysis.recommendedSplitStrategy;
          } else {
            // Fallback to normal injection
            finalFiles = injectFormCodeIntoSandbox({}, formCode, {
              useErrorBoundary: true,
              strictTypeScript: true,
              customStyles,
              ...injectionOptions
            });
          }
        } else {
          // Form doesn't need splitting
          finalFiles = injectFormCodeIntoSandbox({}, formCode, {
            useErrorBoundary: true,
            strictTypeScript: true,
            customStyles,
            ...injectionOptions
          });
        }
      } else {
        // Standard injection without splitting
        finalFiles = injectFormCodeIntoSandbox({}, formCode, {
          useErrorBoundary: true,
          strictTypeScript: true,
          customStyles,
          ...injectionOptions
        });
      }

      // Cache the result for future use
      if (cacheKey && enablePerformanceMode && !cachedResult) {
        setCachedTemplate(cacheKey, finalFiles, formCode);
      }

      // Performance metrics removed to prevent infinite re-renders

      return finalFiles;

    } catch (err) {
      console.error("Error processing form code:", err);
      
      // Return fallback files - don't set state in useMemo
      return createSandboxFiles("", {
        ...injectionOptions,
        customStyles
      });
    }
  }, [formCode, injectionOptions, customStyles, enablePerformanceMode, enableCodeSplitting, formFields, showCodeEditor, showConsole, showFileExplorer]);

  // Handle validation and error states separately to avoid infinite loops
  React.useEffect(() => {
    if (formCode) {
      try {
        const validation = validateFormCode(formCode);
        setValidationStatus(validation);

        if (!validation.isValid) {
          console.warn("Form code validation failed:", validation.errors);
          setError(`Validation failed: ${validation.errors.join(', ')}`);
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("Error validating form code:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to process form code: ${errorMessage}`);
      }
    } else {
      setValidationStatus(null);
      setError(null);
    }
  }, [formCode]);

  // Handle initialization complete
  const handleBundlerLoad = useCallback(() => {
    setIsInitializing(false);
    setError(null);
    setBundleStatus('success');
    setBundleProgress(100);
  }, []);

  // Handle runtime errors
  const handleError = useCallback((error: Error) => {
    console.error("Sandpack error:", error);
    setError(error.message);
    setIsInitializing(false);
    setBundleStatus('error');
    onFormError?.(error);
  }, [onFormError]);

  // Handle bundle progress
  const handleBundleProgress = useCallback((progress: number) => {
    setBundleProgress(progress);
    if (progress > 0 && progress < 100) {
      setBundleStatus('bundling');
    }
  }, []);

  // Handle refresh functionality
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setIsInitializing(true);
    setBundleStatus('idle');
    setBundleProgress(0);
    setError(null);
    onRefresh?.();
  }, [onRefresh]);

  // Handle console toggle
  const handleConsoleToggle = useCallback(() => {
    setConsoleVisible(prev => !prev);
  }, []);

  // Handle open in CodeSandbox
  const handleOpenCodeSandbox = useCallback(() => {
    try {
      // Create CodeSandbox URL with current files
      const sandboxFiles = files;
      const parameters = {
        files: Object.entries(sandboxFiles).reduce((acc, [path, file]) => {
          const content = typeof file === 'string' ? file : file.code || '';
          acc[path.startsWith('/') ? path.slice(1) : path] = {
            content
          };
          return acc;
        }, {} as Record<string, { content: string }>)
      };
      
      const compressed = btoa(JSON.stringify(parameters));
      const sandboxUrl = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${compressed}`;
      
      // Open in new tab
      window.open(sandboxUrl, '_blank');
      onOpenCodeSandbox?.(sandboxUrl);
    } catch (error) {
      console.error('Failed to open CodeSandbox:', error);
    }
  }, [files, onOpenCodeSandbox]);

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

  // Enhanced loading component with progress
  const renderLoadingState = () => (
    <div className={cn("space-y-4 h-full flex flex-col", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            {bundleStatus === 'bundling' ? 'Bundling code...' : 'Loading preview environment...'}
          </span>
        </div>
        {showProgress && bundleProgress > 0 && (
          <Badge variant="secondary" className="text-xs">
            {bundleProgress}%
          </Badge>
        )}
      </div>
      {showProgress && bundleProgress > 0 && (
        <Progress value={bundleProgress} className="h-2" />
      )}
      <Skeleton className="w-full flex-1 rounded-lg" />
    </div>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  // Enhanced toolbar component
  const renderToolbar = () => {
    if (!showToolbar) return null;

    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Play className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Live Preview</span>
          </div>
          {bundleStatus === 'success' && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          )}
          {bundleStatus === 'bundling' && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Building...
            </Badge>
          )}
          {bundleStatus === 'error' && (
            <Badge variant="destructive" className="text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleConsoleToggle}
                className={cn(
                  "h-8 w-8 p-0",
                  consoleVisible && "bg-blue-100 text-blue-700"
                )}
              >
                {consoleVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Terminal className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Console</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={bundleStatus === 'bundling'}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  bundleStatus === 'bundling' && "animate-spin"
                )} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh Preview</p>
            </TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-4 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenCodeSandbox}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in CodeSandbox</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  };

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

  // Enhanced error component with recovery options
  const renderErrorState = () => (
    <div className={cn("border rounded-lg overflow-hidden h-full flex flex-col", className)}>
      {renderToolbar()}
      {renderValidationStatus()}
      <div className="p-6 flex flex-col justify-center items-center flex-1">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="mt-2">
            <strong>Preview Error:</strong> {error}
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              The form preview encountered an error. Please check the generated code and try again.
            </span>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenCodeSandbox}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Debug in CodeSandbox
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  if (error) {
    return renderErrorState();
  }

  // Enhanced Sandpack wrapper component
  const SandpackWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className={cn("border rounded-lg overflow-hidden h-full w-full flex flex-col", className)}>
        {renderToolbar()}
        {renderValidationStatus()}
        <div key={refreshKey} className="relative flex-1 min-h-0 w-full">
          {children}
        </div>
      </div>
    );
  };

  try {
    return (
      <SandpackWrapper>
        <SandpackProvider
          template={template}
          files={files}
          style={{ height: "100%", width: "100%" }}
          customSetup={{
            dependencies: {
              // Core React
              "react": "^19.1.1",
              "react-dom": "^19.1.1",
              
              // SWC Runtime (browser-compatible only)
              "@swc/helpers": "^0.5.5",
              
              // Radix UI Components (comprehensive list)
              "@radix-ui/react-accordion": "^1.2.2",
              "@radix-ui/react-checkbox": "^1.1.4",
              "@radix-ui/react-dialog": "^1.1.4",
              "@radix-ui/react-label": "^2.1.1",
              "@radix-ui/react-popover": "^1.1.4",
              "@radix-ui/react-progress": "^1.1.1",
              "@radix-ui/react-radio-group": "^1.2.2",
              "@radix-ui/react-select": "^2.1.4",
              "@radix-ui/react-slider": "^1.2.2",
              "@radix-ui/react-switch": "^1.1.2",
              "@radix-ui/react-tabs": "^1.1.2",
              "@radix-ui/react-primitive": "^2.0.0",
              "@radix-ui/react-collection": "^1.1.0",
              "@radix-ui/react-compose-refs": "^1.1.0",
              "@radix-ui/react-context": "^1.1.1",
              "@radix-ui/react-dismissable-layer": "^1.1.1",
              "@radix-ui/react-focus-guards": "^1.1.1",
              "@radix-ui/react-focus-scope": "^1.1.0",
              "@radix-ui/react-id": "^1.1.0",
              "@radix-ui/react-portal": "^1.1.2",
              "@radix-ui/react-presence": "^1.1.1",
              "@radix-ui/react-slot": "^1.1.0",
              "@radix-ui/react-use-callback-ref": "^1.1.0",
              "@radix-ui/react-use-controllable-state": "^1.1.0",
              "@radix-ui/react-use-escape-keydown": "^1.1.0",
              "@radix-ui/react-use-layout-effect": "^1.1.0",
              "@radix-ui/react-use-previous": "^1.1.0",
              "@radix-ui/react-use-rect": "^1.1.0",
              "@radix-ui/react-use-size": "^1.1.0",
              "@radix-ui/react-visually-hidden": "^1.1.0",
              
              // Formedible ecosystem
              "@tanstack/react-form": "^0.38.1",
              "zod": "^3.24.1",
              "clsx": "^2.1.1",
              "tailwind-merge": "^2.6.0",
              "sonner": "^1.7.1",
              
              // Additional runtime dependencies
              "lucide-react": "^0.400.0"
            },
            devDependencies: {
              "@types/react": "^18.3.17",
              "@types/react-dom": "^18.3.5",
              "typescript": "^5.7.2"
            }
          }}
          options={{
            bundlerURL: "https://sandpack-bundler.codesandbox.io",
            visibleFiles: showCodeEditor ? ["/FormComponent.tsx", "/App.tsx"] : [],
            activeFile: "/FormComponent.tsx",
            initMode: "lazy",
            autorun: true,
            autoReload: true,
            recompileMode: "delayed",
            recompileDelay: 300
          }}
        >
          <SandpackLayout 
            style={{ height: "100%", width: "100%" }}
            className={showToolbar ? "rounded-b-lg" : "border rounded-lg"}
          >
            {showFileExplorer && <SandpackFileExplorer />}
            {showCodeEditor && (
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                closableTabs
                wrapContent
                style={{ height: "100%" }}
              />
            )}
            <div className="flex flex-col h-full w-full">
              <SandpackPreviewComponent
                showOpenInCodeSandbox={false}
                showRefreshButton={false}
                showNavigator={false}
                style={{ 
                  height: consoleVisible && (showConsole || consoleVisible) ? "60%" : "100%",
                  width: "100%",
                  borderRadius: "0"
                }}
              />
              {(showConsole || consoleVisible) && (
                <div 
                  className="border-t bg-gray-900 text-gray-100"
                  style={{ 
                    height: "40%",
                    display: consoleVisible ? "block" : "none"
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <TerminalSquare className="h-4 w-4" />
                      <span className="text-sm font-medium">Console Output</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleConsoleToggle}
                      className="h-6 w-6 p-0 text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <SandpackConsole
                    showHeader={false}
                    showSyntaxError={true}
                    maxMessageCount={100}
                    resetOnPreviewRestart={true}
                    style={{ 
                      height: "calc(100% - 40px)",
                      backgroundColor: "rgb(17 24 39)",
                      border: "none"
                    }}
                  />
                </div>
              )}
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </SandpackWrapper>
    );
  } catch (err) {
    console.error("Error rendering Sandpack:", err);
    return (
      <SandpackWrapper>
        <Alert className="h-full flex flex-col justify-center m-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Failed to initialize live preview.</strong>
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              Please try refreshing or switch to static preview mode.
            </span>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </SandpackWrapper>
    );
  }
}

export default SandpackPreview;
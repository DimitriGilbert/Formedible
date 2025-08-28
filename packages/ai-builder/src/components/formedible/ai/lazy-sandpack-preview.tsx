"use client";

import React, { lazy, Suspense, useState, useCallback, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  AlertTriangle, 
  Play, 
  Code2, 
  Eye,
  Settings,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load the heavy Sandpack components
const SandpackPreview = lazy(() => import("./sandpack-preview"));

export interface LazySandpackPreviewProps {
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
  /** Custom height for the preview */
  height?: string;
  /** Whether to auto-load the preview */
  autoLoad?: boolean;
  /** Performance mode: 'fast' | 'balanced' | 'full' */
  performanceMode?: 'fast' | 'balanced' | 'full';
  /** Cache key for template caching */
  cacheKey?: string;
  /** Whether to show performance metrics */
  showPerformanceMetrics?: boolean;
  /** Custom loading message */
  loadingMessage?: string;
  /** Whether to preload Sandpack on hover */
  preloadOnHover?: boolean;
}

// Performance metrics interface
interface PerformanceMetrics {
  initTime: number;
  bundleTime: number;
  renderTime: number;
  cacheHit: boolean;
}

// Component cache to store loaded instances
const componentCache = new Map<string, React.ComponentType<any>>();
const templateCache = new Map<string, any>();
const performanceMetrics = new Map<string, PerformanceMetrics>();

/**
 * Lazy-loaded Sandpack Preview with performance optimizations
 */
export function LazySandpackPreview({
  formCode,
  onFormSubmit,
  onFormError,
  className,
  showCodeEditor = false,
  showConsole = false,
  showFileExplorer = false,
  height = "min(80vh, 600px)",
  autoLoad = false,
  performanceMode = 'balanced',
  cacheKey,
  showPerformanceMetrics = false,
  loadingMessage = "Loading live preview...",
  preloadOnHover = true
}: LazySandpackPreviewProps) {
  const [isLoading, setIsLoading] = useState(!autoLoad);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [isPreloading, setIsPreloading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  // Generate cache key if not provided
  const effectiveCacheKey = useMemo(() => {
    if (cacheKey) return cacheKey;
    
    // Create cache key based on form code hash and configuration
    const configHash = JSON.stringify({
      showCodeEditor,
      showConsole,
      showFileExplorer,
      performanceMode
    });
    
    const formHash = formCode ? btoa(formCode.substring(0, 100)) : 'empty';
    return `sandpack-${formHash}-${btoa(configHash)}`.replace(/[^a-zA-Z0-9-]/g, '');
  }, [cacheKey, formCode, showCodeEditor, showConsole, showFileExplorer, performanceMode]);

  // Check if component is cached
  const isCached = useMemo(() => {
    return componentCache.has(effectiveCacheKey) && templateCache.has(effectiveCacheKey);
  }, [effectiveCacheKey]);

  // Preload component on hover if enabled
  const handlePreload = useCallback(async () => {
    if (!preloadOnHover || isPreloading || !isLoading) return;
    
    setIsPreloading(true);
    try {
      // Preload the component
      await import("./sandpack-preview");
    } catch (error) {
      console.warn("Failed to preload Sandpack component:", error);
    } finally {
      setIsPreloading(false);
    }
  }, [preloadOnHover, isPreloading, isLoading]);

  // Handle loading the preview
  const handleLoadPreview = useCallback(async () => {
    if (!isLoading) return;

    const loadStartTime = performance.now();
    setStartTime(loadStartTime);
    setLoadError(null);

    try {
      // Check cache first
      let cacheHit = false;
      if (isCached) {
        cacheHit = true;
        console.log("Loading from cache:", effectiveCacheKey);
      }

      // Load the component
      setIsLoading(false);
      
      // Record performance metrics
      const initTime = performance.now() - loadStartTime;
      const newMetrics: PerformanceMetrics = {
        initTime,
        bundleTime: 0,
        renderTime: 0,
        cacheHit
      };
      
      setMetrics(newMetrics);
      performanceMetrics.set(effectiveCacheKey, newMetrics);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load preview';
      setLoadError(errorMessage);
      console.error("Failed to load Sandpack preview:", error);
    }
  }, [isLoading, isCached, effectiveCacheKey]);

  // Performance-optimized options based on mode
  const sandpackOptions = useMemo(() => {
    const baseOptions = {
      formCode,
      onFormSubmit,
      onFormError,
      className: cn("lazy-sandpack-container", className),
      height
    };

    switch (performanceMode) {
      case 'fast':
        return {
          ...baseOptions,
          showCodeEditor: false,
          showConsole: false,
          showFileExplorer: false,
          showToolbar: true,
          showProgress: false,
          showValidationStatus: false
        };
      
      case 'balanced':
        return {
          ...baseOptions,
          showCodeEditor,
          showConsole: false,
          showFileExplorer: false,
          showToolbar: true,
          showProgress: true,
          showValidationStatus: true
        };
      
      case 'full':
        return {
          ...baseOptions,
          showCodeEditor,
          showConsole,
          showFileExplorer,
          showToolbar: true,
          showProgress: true,
          showValidationStatus: true
        };
      
      default:
        return baseOptions;
    }
  }, [
    formCode,
    onFormSubmit,
    onFormError,
    className,
    height,
    showCodeEditor,
    showConsole,
    showFileExplorer,
    performanceMode
  ]);

  // Enhanced loading placeholder with performance mode indicators
  const renderLoadingPlaceholder = () => (
    <Card 
      className={cn("cursor-pointer transition-all duration-200 hover:shadow-lg", className)}
      style={{ height }}
      onMouseEnter={handlePreload}
      onClick={handleLoadPreview}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-blue-600" />
            <span>Live Preview</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {performanceMode === 'fast' && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <Zap className="h-3 w-3" />
                <span className="text-xs">Fast Mode</span>
              </div>
            )}
            {isCached && (
              <div className="flex items-center gap-1 text-blue-600 text-sm">
                <Settings className="h-3 w-3" />
                <span className="text-xs">Cached</span>
              </div>
            )}
            {isPreloading && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            <p className="text-xs text-muted-foreground">
              Click to load interactive preview with full form functionality
            </p>
            {showPerformanceMetrics && metrics && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Init: {metrics.initTime.toFixed(2)}ms</div>
                <div>Cache: {metrics.cacheHit ? 'Hit' : 'Miss'}</div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Code2 className="h-4 w-4" />
              <span>Interactive Form</span>
            </div>
            {performanceMode !== 'fast' && (
              <div className="flex gap-1">
                {showCodeEditor && <Eye className="h-3 w-3 text-gray-400" />}
                {showConsole && <Settings className="h-3 w-3 text-gray-400" />}
                {showFileExplorer && <Code2 className="h-3 w-3 text-gray-400" />}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-10 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );

  // Error state
  const renderErrorState = () => (
    <Card className={className} style={{ height }}>
      <CardContent className="flex flex-col justify-center items-center h-full p-6">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="mt-2">
            <strong>Failed to load live preview:</strong> {loadError}
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoadPreview}
                className="text-xs"
              >
                <Loader2 className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  // Suspense fallback with performance metrics
  const renderSuspenseFallback = () => (
    <Card className={className} style={{ height }}>
      <CardContent className="flex flex-col justify-center items-center h-full p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Initializing live preview...</span>
        </div>
        {showPerformanceMetrics && startTime > 0 && (
          <div className="text-xs text-muted-foreground">
            Loading: {((performance.now() - startTime) / 1000).toFixed(1)}s
          </div>
        )}
        <div className="space-y-2 w-full max-w-md">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );

  // Show error state if there's an error
  if (loadError) {
    return renderErrorState();
  }

  // Show loading placeholder if not yet loaded
  if (isLoading) {
    return renderLoadingPlaceholder();
  }

  // Render the actual Sandpack component with Suspense
  return (
    <Suspense fallback={renderSuspenseFallback()}>
      <SandpackPreview 
        {...sandpackOptions}
        onFormSubmit={(data) => {
          // Update metrics on form interaction
          if (metrics) {
            const updatedMetrics = {
              ...metrics,
              renderTime: performance.now() - startTime
            };
            setMetrics(updatedMetrics);
            performanceMetrics.set(effectiveCacheKey, updatedMetrics);
          }
          onFormSubmit?.(data);
        }}
        onFormError={(error) => {
          console.error("Form error in lazy Sandpack:", error);
          onFormError?.(error);
        }}
      />
      {showPerformanceMetrics && metrics && (
        <div className="mt-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded">
          <div className="flex gap-4">
            <span>Init: {metrics.initTime.toFixed(2)}ms</span>
            <span>Cache: {metrics.cacheHit ? '✓' : '✗'}</span>
            <span>Mode: {performanceMode}</span>
            {metrics.renderTime > 0 && <span>Render: {metrics.renderTime.toFixed(2)}ms</span>}
          </div>
        </div>
      )}
    </Suspense>
  );
}

/**
 * Preload Sandpack component for better performance
 */
export function preloadSandpackPreview(): Promise<any> {
  return import("./sandpack-preview");
}

/**
 * Clear component cache (useful for development)
 */
export function clearSandpackCache(): void {
  componentCache.clear();
  templateCache.clear();
  performanceMetrics.clear();
}

/**
 * Get cache statistics
 */
export function getSandpackCacheStats() {
  return {
    components: componentCache.size,
    templates: templateCache.size,
    metrics: performanceMetrics.size
  };
}

export default LazySandpackPreview;
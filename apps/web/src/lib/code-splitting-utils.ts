/**
 * Code Splitting Utilities for Large Form Components
 * 
 * Implements intelligent code splitting strategies to improve loading performance
 * for complex Formedible forms with many fields and advanced features.
 */

import type { SandpackFiles } from "@codesandbox/sandpack-react";

// Configuration for code splitting thresholds
interface CodeSplittingConfig {
  maxComponentSize: number; // Maximum size in characters before splitting
  maxFieldsPerChunk: number; // Maximum fields per component chunk
  splitByFieldType: boolean; // Whether to split by field types
  splitByPage: boolean; // Whether to split multi-page forms
  enableLazyLoading: boolean; // Whether to enable lazy loading for chunks
}

// Default configuration
const DEFAULT_CONFIG: CodeSplittingConfig = {
  maxComponentSize: 5000,
  maxFieldsPerChunk: 10,
  splitByFieldType: true,
  splitByPage: true,
  enableLazyLoading: true
};

// Field type categories for intelligent splitting
const FIELD_TYPE_CATEGORIES = {
  basic: ['text', 'email', 'password', 'number', 'tel', 'url'],
  selection: ['select', 'radio', 'checkbox', 'multiselect'],
  advanced: ['date', 'datetime', 'time', 'file', 'color', 'range'],
  rich: ['textarea', 'richtext', 'wysiwyg', 'markdown'],
  custom: ['custom', 'composite', 'repeater', 'matrix']
};

// Form analysis result
interface FormAnalysis {
  totalSize: number;
  fieldCount: number;
  pageCount: number;
  fieldTypes: Record<string, number>;
  hasConditionalLogic: boolean;
  hasValidation: boolean;
  hasCustomComponents: boolean;
  complexityScore: number;
  shouldSplit: boolean;
  recommendedSplitStrategy: 'none' | 'fields' | 'pages' | 'types' | 'hybrid';
}

// Code chunk information
interface CodeChunk {
  id: string;
  name: string;
  code: string;
  dependencies: string[];
  fields: any[];
  size: number;
  category: string;
  lazyLoad: boolean;
}

// Split result
interface SplitResult {
  chunks: CodeChunk[];
  mainComponent: string;
  imports: string[];
  totalSize: number;
  compressionRatio: number;
}

/**
 * Analyze form code to determine if splitting is beneficial
 */
export function analyzeFormCode(formCode: string, fields: any[] = []): FormAnalysis {
  const size = formCode.length;
  const fieldCount = fields.length || estimateFieldCount(formCode);
  const pageCount = estimatePageCount(formCode);
  
  // Count field types
  const fieldTypes: Record<string, number> = {};
  fields.forEach(field => {
    const type = field.type || 'text';
    fieldTypes[type] = (fieldTypes[type] || 0) + 1;
  });
  
  // Detect features
  const hasConditionalLogic = /conditional|if\s*\(|when\s*\(|show.*when/i.test(formCode);
  const hasValidation = /validation|validate|required|min|max|pattern/i.test(formCode);
  const hasCustomComponents = /custom|composite|complex/i.test(formCode);
  
  // Calculate complexity score (0-100)
  let complexityScore = 0;
  complexityScore += Math.min(fieldCount * 2, 40); // Field count contribution (max 40)
  complexityScore += Math.min(size / 100, 20); // Code size contribution (max 20)
  complexityScore += pageCount * 10; // Multi-page contribution
  complexityScore += hasConditionalLogic ? 15 : 0; // Conditional logic
  complexityScore += hasValidation ? 10 : 0; // Validation
  complexityScore += hasCustomComponents ? 15 : 0; // Custom components
  
  // Determine if splitting is beneficial
  const shouldSplit = size > DEFAULT_CONFIG.maxComponentSize || 
                     fieldCount > DEFAULT_CONFIG.maxFieldsPerChunk ||
                     complexityScore > 60;
  
  // Recommend split strategy
  let recommendedSplitStrategy: FormAnalysis['recommendedSplitStrategy'] = 'none';
  if (shouldSplit) {
    if (pageCount > 1) {
      recommendedSplitStrategy = 'pages';
    } else if (fieldCount > DEFAULT_CONFIG.maxFieldsPerChunk * 2) {
      recommendedSplitStrategy = 'fields';
    } else if (Object.keys(fieldTypes).length > 3) {
      recommendedSplitStrategy = 'types';
    } else {
      recommendedSplitStrategy = 'hybrid';
    }
  }
  
  return {
    totalSize: size,
    fieldCount,
    pageCount,
    fieldTypes,
    hasConditionalLogic,
    hasValidation,
    hasCustomComponents,
    complexityScore,
    shouldSplit,
    recommendedSplitStrategy
  };
}

/**
 * Split form code into optimized chunks
 */
export function splitFormCode(
  formCode: string, 
  fields: any[] = [], 
  config: Partial<CodeSplittingConfig> = {}
): SplitResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const analysis = analyzeFormCode(formCode, fields);
  
  if (!analysis.shouldSplit) {
    return {
      chunks: [],
      mainComponent: formCode,
      imports: extractImports(formCode),
      totalSize: formCode.length,
      compressionRatio: 1.0
    };
  }
  
  const chunks: CodeChunk[] = [];
  let mainComponentCode = '';
  
  switch (analysis.recommendedSplitStrategy) {
    case 'pages':
      return splitByPages(formCode, fields, finalConfig);
    case 'fields':
      return splitByFields(formCode, fields, finalConfig);
    case 'types':
      return splitByFieldTypes(formCode, fields, finalConfig);
    case 'hybrid':
      return splitHybrid(formCode, fields, finalConfig);
    default:
      return {
        chunks: [],
        mainComponent: formCode,
        imports: extractImports(formCode),
        totalSize: formCode.length,
        compressionRatio: 1.0
      };
  }
}

/**
 * Split by form pages
 */
function splitByPages(
  formCode: string, 
  fields: any[], 
  config: CodeSplittingConfig
): SplitResult {
  const chunks: CodeChunk[] = [];
  const pageGroups = groupFieldsByPage(fields);
  
  pageGroups.forEach((pageFields, pageIndex) => {
    const chunkCode = generatePageComponent(pageFields, pageIndex);
    
    chunks.push({
      id: `page-${pageIndex}`,
      name: `FormPage${pageIndex + 1}`,
      code: chunkCode,
      dependencies: extractDependencies(chunkCode),
      fields: pageFields,
      size: chunkCode.length,
      category: 'page',
      lazyLoad: config.enableLazyLoading && pageIndex > 0
    });
  });
  
  const mainComponent = generateMainFormComponent(chunks, 'pages');
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0) + mainComponent.length;
  
  return {
    chunks,
    mainComponent,
    imports: extractImports(formCode),
    totalSize,
    compressionRatio: formCode.length / totalSize
  };
}

/**
 * Split by field groups
 */
function splitByFields(
  formCode: string, 
  fields: any[], 
  config: CodeSplittingConfig
): SplitResult {
  const chunks: CodeChunk[] = [];
  const fieldGroups = chunkArray(fields, config.maxFieldsPerChunk);
  
  fieldGroups.forEach((fieldGroup, groupIndex) => {
    const chunkCode = generateFieldGroupComponent(fieldGroup, groupIndex);
    
    chunks.push({
      id: `fields-${groupIndex}`,
      name: `FieldGroup${groupIndex + 1}`,
      code: chunkCode,
      dependencies: extractDependencies(chunkCode),
      fields: fieldGroup,
      size: chunkCode.length,
      category: 'fields',
      lazyLoad: config.enableLazyLoading && groupIndex > 0
    });
  });
  
  const mainComponent = generateMainFormComponent(chunks, 'fields');
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0) + mainComponent.length;
  
  return {
    chunks,
    mainComponent,
    imports: extractImports(formCode),
    totalSize,
    compressionRatio: formCode.length / totalSize
  };
}

/**
 * Split by field types
 */
function splitByFieldTypes(
  formCode: string, 
  fields: any[], 
  config: CodeSplittingConfig
): SplitResult {
  const chunks: CodeChunk[] = [];
  const typeGroups = groupFieldsByType(fields);
  
  Object.entries(typeGroups).forEach(([category, categoryFields]) => {
    if (categoryFields.length === 0) return;
    
    const chunkCode = generateTypeComponent(categoryFields, category);
    
    chunks.push({
      id: `type-${category}`,
      name: `${category.charAt(0).toUpperCase() + category.slice(1)}Fields`,
      code: chunkCode,
      dependencies: extractDependencies(chunkCode),
      fields: categoryFields,
      size: chunkCode.length,
      category: 'type',
      lazyLoad: config.enableLazyLoading && category !== 'basic'
    });
  });
  
  const mainComponent = generateMainFormComponent(chunks, 'types');
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0) + mainComponent.length;
  
  return {
    chunks,
    mainComponent,
    imports: extractImports(formCode),
    totalSize,
    compressionRatio: formCode.length / totalSize
  };
}

/**
 * Hybrid splitting strategy
 */
function splitHybrid(
  formCode: string, 
  fields: any[], 
  config: CodeSplittingConfig
): SplitResult {
  const chunks: CodeChunk[] = [];
  
  // First split by pages if multi-page
  const pageGroups = groupFieldsByPage(fields);
  
  pageGroups.forEach((pageFields, pageIndex) => {
    // Then split large pages by field types
    if (pageFields.length > config.maxFieldsPerChunk) {
      const typeGroups = groupFieldsByType(pageFields);
      
      Object.entries(typeGroups).forEach(([category, categoryFields]) => {
        if (categoryFields.length === 0) return;
        
        const chunkCode = generateHybridComponent(categoryFields, pageIndex, category);
        
        chunks.push({
          id: `page${pageIndex}-${category}`,
          name: `Page${pageIndex + 1}${category.charAt(0).toUpperCase() + category.slice(1)}`,
          code: chunkCode,
          dependencies: extractDependencies(chunkCode),
          fields: categoryFields,
          size: chunkCode.length,
          category: 'hybrid',
          lazyLoad: config.enableLazyLoading && (pageIndex > 0 || category !== 'basic')
        });
      });
    } else {
      // Keep small pages as single chunks
      const chunkCode = generatePageComponent(pageFields, pageIndex);
      
      chunks.push({
        id: `page-${pageIndex}`,
        name: `FormPage${pageIndex + 1}`,
        code: chunkCode,
        dependencies: extractDependencies(chunkCode),
        fields: pageFields,
        size: chunkCode.length,
        category: 'page',
        lazyLoad: config.enableLazyLoading && pageIndex > 0
      });
    }
  });
  
  const mainComponent = generateMainFormComponent(chunks, 'hybrid');
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0) + mainComponent.length;
  
  return {
    chunks,
    mainComponent,
    imports: extractImports(formCode),
    totalSize,
    compressionRatio: formCode.length / totalSize
  };
}

/**
 * Convert split result to Sandpack files
 */
export function splitResultToSandpackFiles(splitResult: SplitResult): SandpackFiles {
  const files: SandpackFiles = {};
  
  // Main component
  files['/FormComponent.tsx'] = {
    code: splitResult.mainComponent
  };
  
  // Chunk files
  splitResult.chunks.forEach(chunk => {
    const filename = chunk.lazyLoad ? 
      `/components/lazy/${chunk.name}.tsx` : 
      `/components/${chunk.name}.tsx`;
      
    files[filename] = {
      code: chunk.code
    };
  });
  
  // Create index file for chunks
  const chunkExports = splitResult.chunks
    .map(chunk => `export { default as ${chunk.name} } from './${chunk.lazyLoad ? 'lazy/' : ''}${chunk.name}';`)
    .join('\n');
    
  files['/components/index.ts'] = {
    code: chunkExports
  };
  
  return files;
}

// Helper functions

function estimateFieldCount(code: string): number {
  const fieldMatches = code.match(/input|select|textarea|field/gi);
  return fieldMatches ? fieldMatches.length : 0;
}

function estimatePageCount(code: string): number {
  const pageMatches = code.match(/page|step|section/gi);
  return Math.max(pageMatches ? pageMatches.length : 1, 1);
}

function extractImports(code: string): string[] {
  const importMatches = code.match(/import\s+.*?from\s+['"].*?['"];?/g);
  return importMatches || [];
}

function extractDependencies(code: string): string[] {
  const deps = extractImports(code).map(imp => {
    const match = imp.match(/from\s+['"]([^'"]*)['"]/);
    return match ? match[1] : '';
  }).filter(Boolean);
  
  return [...new Set(deps)];
}

function groupFieldsByPage(fields: any[]): any[][] {
  // Simple implementation - group by page property or assume single page
  const pages: any[][] = [[]];
  
  fields.forEach(field => {
    const pageIndex = field.page || 0;
    if (!pages[pageIndex]) pages[pageIndex] = [];
    pages[pageIndex].push(field);
  });
  
  return pages.filter(page => page.length > 0);
}

function groupFieldsByType(fields: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {
    basic: [],
    selection: [],
    advanced: [],
    rich: [],
    custom: []
  };
  
  fields.forEach(field => {
    const type = field.type || 'text';
    let category = 'custom';
    
    for (const [cat, types] of Object.entries(FIELD_TYPE_CATEGORIES)) {
      if (types.includes(type)) {
        category = cat;
        break;
      }
    }
    
    groups[category].push(field);
  });
  
  return groups;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function generatePageComponent(fields: any[], pageIndex: number): string {
  return `import React from 'react';

export default function FormPage${pageIndex + 1}({ formData, onUpdate }: {
  formData: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
}) {
  return (
    <div className="form-page" data-page="${pageIndex}">
      <h3 className="text-lg font-semibold mb-4">Step ${pageIndex + 1}</h3>
      {/* Fields for page ${pageIndex + 1} */}
      {/* Generated fields would go here */}
    </div>
  );
}`;
}

function generateFieldGroupComponent(fields: any[], groupIndex: number): string {
  return `import React from 'react';

export default function FieldGroup${groupIndex + 1}({ formData, onUpdate }: {
  formData: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
}) {
  return (
    <div className="field-group" data-group="${groupIndex}">
      {/* Field group ${groupIndex + 1} with ${fields.length} fields */}
      {/* Generated fields would go here */}
    </div>
  );
}`;
}

function generateTypeComponent(fields: any[], category: string): string {
  return `import React from 'react';

export default function ${category.charAt(0).toUpperCase() + category.slice(1)}Fields({ formData, onUpdate }: {
  formData: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
}) {
  return (
    <div className="field-type-group" data-type="${category}">
      {/* ${category} fields component with ${fields.length} fields */}
      {/* Generated fields would go here */}
    </div>
  );
}`;
}

function generateHybridComponent(fields: any[], pageIndex: number, category: string): string {
  return `import React from 'react';

export default function Page${pageIndex + 1}${category.charAt(0).toUpperCase() + category.slice(1)}({ formData, onUpdate }: {
  formData: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
}) {
  return (
    <div className="hybrid-component" data-page="${pageIndex}" data-type="${category}">
      {/* Page ${pageIndex + 1} ${category} fields with ${fields.length} fields */}
      {/* Generated fields would go here */}
    </div>
  );
}`;
}

function generateMainFormComponent(chunks: CodeChunk[], strategy: string): string {
  const imports = chunks
    .map(chunk => `import ${chunk.lazyLoad ? '{ lazy }' : chunk.name} from './components/${chunk.lazyLoad ? 'lazy/' : ''}${chunk.name}';`)
    .join('\n');
  
  const lazyImports = chunks
    .filter(chunk => chunk.lazyLoad)
    .map(chunk => `const ${chunk.name} = lazy(() => import('./components/lazy/${chunk.name}'));`)
    .join('\n');
    
  return `import React, { useState, Suspense } from 'react';
${imports}
${lazyImports}

export default function FormComponent({ onSubmit }: {
  onSubmit?: (data: Record<string, any>) => void;
}) {
  const [formData, setFormData] = useState({});
  
  const handleUpdate = (newData: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };
  
  const handleSubmit = () => {
    onSubmit?.(formData);
  };
  
  return (
    <div className="form-container split-strategy-${strategy}">
      <Suspense fallback={<div className="loading">Loading form sections...</div>}>
        {/* Rendered chunks would go here */}
        {/* This is a simplified version - actual implementation would render chunks based on strategy */}
      </Suspense>
      
      <button 
        type="button" 
        onClick={handleSubmit}
        className="submit-button mt-6"
      >
        Submit Form
      </button>
    </div>
  );
}`;
}

export { DEFAULT_CONFIG as CODE_SPLITTING_CONFIG };
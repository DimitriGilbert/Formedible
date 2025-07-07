import type { MDXComponents } from 'mdx/types';
import { CodeBlock } from '@/components/ui/code-block';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mb-4 mt-8 text-slate-900 dark:text-slate-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold mb-3 mt-6 text-slate-800 dark:text-slate-200">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    code: ({ children, className }) => {
      const language = className?.replace('language-', '') || 'tsx';
      if (typeof children === 'string' && children.includes('\n')) {
        return <CodeBlock code={children} language={language} showLineNumbers={true} />;
      }
      return (
        <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-sm font-mono">
          {children}
        </code>
      );
    },
    pre: ({ children }) => children,
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-slate-700 dark:text-slate-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-slate-700 dark:text-slate-300">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="ml-4">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 dark:bg-blue-950/20 rounded-r">
        {children}
      </blockquote>
    ),
    ...components,
  };
}
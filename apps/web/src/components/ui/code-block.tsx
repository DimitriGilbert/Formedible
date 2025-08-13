"use client";

import React, { useState, useEffect } from "react";
import { Highlight } from "prism-react-renderer";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

/**
 * Unified CodeBlock component with syntax highlighting, copy functionality, and package manager tabs
 *
 * Features:
 * - Syntax highlighting using Prism.js with Gruvbox theme (light/dark)
 * - Floating copy button with animation feedback
 * - Optional line numbers
 * - Package manager tabs for installation commands (npx, pnpm, yarn, bunx)
 * - Optional title header
 * - Responsive design with proper overflow handling
 */

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  showPackageManagerTabs?: boolean;
  className?: string;
  title?: string;
}

// Copy Button Component
const CopyButton: React.FC<{ text: string; className?: string }> = ({
  text,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <motion.button
      onClick={copyToClipboard}
      className={`relative inline-flex items-center justify-center p-2 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm transition-colors shadow-lg ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check className="w-4 h-4 text-accent" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Empty theme to allow external CSS themes
const emptyTheme = { plain: {}, styles: [] };

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "tsx",
  showLineNumbers = false,
  showCopyButton = true,
  showPackageManagerTabs = false,
  className = "",
  title,
}) => {
  const [selectedPM, setSelectedPM] = useState("npx");
  const { theme } = useTheme();

  useEffect(() => {
    // Load Gruvbox theme CSS based on current theme
    const existingLink = document.querySelector('link[data-prism-theme]');
    if (existingLink) {
      existingLink.remove();
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-prism-theme', 'true');
    
    if (theme === 'light') {
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism-themes/1.9.0/prism-gruvbox-light.min.css';
    } else {
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism-themes/1.9.0/prism-gruvbox-dark.min.css';
    }
    
    document.head.appendChild(link);

    return () => {
      const linkToRemove = document.querySelector('link[data-prism-theme]');
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, [theme]);

  const packageManagers = {
    npx: code,
    pnpm: code.replace("npx shadcn@latest", "pnpm dlx shadcn@latest"),
    yarn: code.replace("npx shadcn@latest", "yarn dlx shadcn@latest"),
    bunx: code.replace("npx shadcn@latest", "bun x shadcn@latest"),
  };

  const currentCode = showPackageManagerTabs
    ? packageManagers[selectedPM as keyof typeof packageManagers]
    : code;

  return (
    <div className={`relative ${className}`}>
      {title && (
        <div className="bg-muted text-muted-foreground px-4 py-2 text-sm font-medium rounded-t-lg border-b">
          {title}
        </div>
      )}

      {showPackageManagerTabs && (
        <div className="flex gap-1 mb-2">
          {Object.keys(packageManagers).map((pm) => (
            <button
              key={pm}
              onClick={() => setSelectedPM(pm)}
              className={`px-3 py-1 text-xs rounded-t-md transition-colors ${
                selectedPM === pm
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {pm}
            </button>
          ))}
        </div>
      )}

      <div className="relative group">
        <Highlight
          theme={emptyTheme}
          code={currentCode.trim()}
          language={language as any}
        >
          {({
            className: highlightClassName,
            style,
            tokens,
            getLineProps,
            getTokenProps,
          }) => (
            <pre
              className={`${highlightClassName} p-4 rounded-lg font-mono text-sm overflow-x-auto ${
                showPackageManagerTabs ? "rounded-tl-none" : ""
              } ${title ? "rounded-t-none" : ""}`}
              style={style}
            >
              {tokens.map((line, i) => (
                <div
                  key={i}
                  {...getLineProps({ line })}
                  className={showLineNumbers ? "table-row" : ""}
                >
                  {showLineNumbers && (
                    <span className="table-cell text-right pr-4 text-muted-foreground select-none text-xs">
                      {" "}
                      {i + 1}
                    </span>
                  )}
                  <span className={showLineNumbers ? "table-cell" : ""}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>

        {showCopyButton && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <CopyButton text={currentCode} />
          </div>
        )}
      </div>
    </div>
  );
};

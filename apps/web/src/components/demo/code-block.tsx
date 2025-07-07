import React from "react";
import { CodeBlock as UnifiedCodeBlock } from "@/components/ui/code-block";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = "tsx" }) => (
  <UnifiedCodeBlock 
    code={code} 
    language={language} 
    showLineNumbers={true}
    showCopyButton={true}
  />
);
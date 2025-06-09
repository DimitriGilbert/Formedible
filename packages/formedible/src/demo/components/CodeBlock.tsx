import React from "react";
import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = "tsx" }) => (
  <Highlight theme={themes.vsDark} code={code.trim()} language={language}>
    {({ className, style, tokens, getLineProps, getTokenProps }) => (
      <div className="relative">
        <pre 
          className={`${className} rounded-lg p-4 overflow-x-auto text-sm`} 
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })} className="table-row">
              <span className="table-cell text-right pr-4 text-slate-500 select-none text-xs">
                {i + 1}
              </span>
              <span className="table-cell">
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>
    )}
  </Highlight>
); 
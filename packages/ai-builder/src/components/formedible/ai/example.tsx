"use client";
import React, { useState } from "react";
import { AiFormRenderer, parseAiToFormedible } from "./ai-form-renderer";
import type { AiFormParseResult } from "./ai-form-renderer";

const sampleAiCode = `{
  fields: [
    {
      name: "firstName",
      type: "text",
      label: "First Name",
      placeholder: "Enter your first name"
    },
    {
      name: "lastName", 
      type: "text",
      label: "Last Name",
      placeholder: "Enter your last name"
    },
    {
      name: "email",
      type: "email", 
      label: "Email Address",
      placeholder: "your.email@example.com"
    },
    {
      name: "age",
      type: "number",
      label: "Age",
      min: 18,
      max: 100
    },
    {
      name: "country",
      type: "select",
      label: "Country",
      options: [
        { value: "us", label: "United States" },
        { value: "ca", label: "Canada" },
        { value: "uk", label: "United Kingdom" },
        { value: "de", label: "Germany" },
        { value: "fr", label: "France" }
      ]
    },
    {
      name: "newsletter",
      type: "checkbox",
      label: "Subscribe to newsletter"
    },
    {
      name: "rating",
      type: "rating",
      label: "Rate our service",
      ratingConfig: {
        max: 5,
        allowHalf: true
      }
    }
  ],
  submitLabel: "Submit Registration",
  formOptions: {
    canSubmitWhenInvalid: false
  }
}`;

export function AiFormExample() {
  const [parseResult, setParseResult] = useState<AiFormParseResult | null>(null);
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null);

  const handleParseComplete = (result: AiFormParseResult) => {
    setParseResult(result);
    console.log('Parse result:', result);
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    console.log('Form submitted with data:', formData);
    setSubmittedData(formData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Form Renderer Example</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Parse Status</h2>
        {parseResult ? (
          <div className={`p-4 rounded-md ${parseResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {parseResult.success ? (
              <div>
                <div className="font-medium">✓ Parse Successful</div>
                <div className="text-sm mt-1">
                  Found {parseResult.formOptions.fields?.length || 0} fields
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium">✗ Parse Failed</div>
                <div className="text-sm mt-1">{parseResult.error}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 text-gray-600 rounded-md">
            Waiting for parse...
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Generated Form</h2>
        <div className="border rounded-md p-4">
          <AiFormRenderer
            code={sampleAiCode}
            onParseComplete={handleParseComplete}
            onSubmit={handleSubmit}
            debug={true}
            className="space-y-4"
          />
        </div>
      </div>

      {submittedData && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Submitted Data</h2>
          <pre className="p-4 bg-gray-100 rounded-md text-sm overflow-auto">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function StandaloneParserExample() {
  const [code, setCode] = useState(sampleAiCode);
  const [result, setResult] = useState<AiFormParseResult | null>(null);

  const handleParse = () => {
    const parseResult = parseAiToFormedible(code);
    setResult(parseResult);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Standalone Parser Example</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">AI Code Input</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-96 p-4 border rounded-md font-mono text-sm"
            placeholder="Enter AI-generated form code..."
          />
          <button
            onClick={handleParse}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Parse Code
          </button>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Parse Result</h2>
          {result ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {result.success ? '✓ Parse Successful' : `✗ Parse Failed: ${result.error}`}
              </div>
              
              {result.success && (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-md">
                    <div className="font-medium">Fields: {result.formOptions.fields?.length || 0}</div>
                  </div>
                  
                  <details className="bg-gray-50 rounded-md">
                    <summary className="p-3 cursor-pointer font-medium">
                      View Full Result
                    </summary>
                    <pre className="p-3 text-xs overflow-auto max-h-96">
                      {JSON.stringify(result.formOptions, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 text-gray-600 rounded-md">
              Click "Parse Code" to see results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
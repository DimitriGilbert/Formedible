import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "./code-block";

interface DemoCardProps {
  title: string;
  description: string;
  preview: React.ReactNode;
  code: string;
  codeTitle?: string;
  codeDescription?: string;
}

export const DemoCard: React.FC<DemoCardProps> = ({
  title,
  description,
  preview,
  code,
  codeTitle,
  codeDescription,
}) => (
  <Tabs defaultValue="preview" className="w-full">
    <TabsList className="grid w-full grid-cols-2 mb-0">
      <TabsTrigger value="preview">Preview</TabsTrigger>
      <TabsTrigger value="code">Code</TabsTrigger>
    </TabsList>
    <TabsContent value="preview" className="mt-0">
      <Card className="rounded-t-none border-t-0 bg-muted/30">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto">
          <div className="relative">
            {preview}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="code" className="mt-0">
      <Card className="rounded-t-none border-t-0">
        <CardHeader>
          <CardTitle>{codeTitle || `${title} Code`}</CardTitle>
          <CardDescription>
            {codeDescription || `Implementation code for ${title.toLowerCase()}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <CodeBlock code={code} />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
);
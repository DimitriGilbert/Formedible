import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { useTheme } from "next-themes";

interface DemoCardProps {
  title: string;
  description: string;
  preview: React.ReactNode;
  code: string;
  codeTitle?: string;
  codeDescription?: string;
  badges?: Array<{ text: string; variant?: "default" | "secondary" | "destructive" | "outline" }>;
}

export const DemoCard: React.FC<DemoCardProps> = ({
  title,
  description,
  preview,
  code,
  codeTitle,
  codeDescription,
  badges,
}) => {
  const { theme, systemTheme } = useTheme();
  
  // Determine the current theme - handle 'system' theme by falling back to systemTheme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const darkMode = currentTheme === 'dark';

  return (
  <Tabs defaultValue="preview" className="w-full">
    <TabsList className="grid w-full grid-cols-2 mb-0">
      <TabsTrigger value="preview">Preview</TabsTrigger>
      <TabsTrigger value="code">Code</TabsTrigger>
    </TabsList>
    <TabsContent value="preview" className="mt-0">
      <Card className="rounded-t-none border-t-0 bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            {badges?.map((badge, index) => (
              <Badge key={index} variant={badge.variant || "secondary"}>
                {badge.text}
              </Badge>
            ))}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
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
          <CodeBlock code={code} darkMode={darkMode} />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
  );
};
"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const analyticsTrackingSchema = z.object({
  email: z.string().email("Valid email required"),
  companySize: z.enum(["1-10", "11-50", "51-200", "200+"]),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  budget: z.enum(["<10k", "10k-50k", "50k-100k", "100k+"]),
  timeline: z.string().min(1, "Timeline is required"),
  description: z.string().min(20, "Please provide more details"),
});

export const analyticsTrackingFormCode = `const analyticsTrackingSchema = z.object({
  email: z.string().email("Valid email required"),
  companySize: z.enum(["1-10", "11-50", "51-200", "200+"]),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  budget: z.enum(["<10k", "10k-50k", "50k-100k", "100k+"]),
  timeline: z.string().min(1, "Timeline is required"),
  description: z.string().min(20, "Please provide more details"),
});

// Analytics callbacks - memoized to prevent re-renders
const onFormStart = React.useCallback((timestamp: number) => {
  console.log("📊 Form started at:", new Date(timestamp).toISOString());
}, []);

const onFieldFocus = React.useCallback(
  (fieldName: string, timestamp: number) => {
    console.log(
      \`👁️ Field "\${fieldName}" focused at:\`,
      new Date(timestamp).toISOString()
    );
  },
  []
);

const onFieldBlur = React.useCallback(
  (fieldName: string, timeSpent: number) => {
    console.log(\`⏱️ Field "\${fieldName}" completed in \${timeSpent}ms\`);
  },
  []
);

const onPageChange = React.useCallback(
  (fromPage: number, toPage: number, timeSpent: number) => {
    console.log(\`📄 Page \${fromPage} → \${toPage} (spent \${timeSpent}ms)\`);
  },
  []
);

const onFormComplete = React.useCallback(
  (timeSpent: number, formData: any) => {
    console.log(\`✅ Form completed in \${timeSpent}ms with data:\`, formData);
    toast.success("Analytics form completed!", {
      description: \`Total time: \${(timeSpent / 1000).toFixed(
        1
      )}s - Check console for full analytics\`,
    });
  },
  []
);

const onFormAbandon = React.useCallback((completionPercentage: number) => {
  console.log(\`❌ Form abandoned at \${completionPercentage}% completion\`);
}, []);

// Memoize the analytics object
const analyticsConfig = React.useMemo(
  () => ({
    onFormStart,
    onFieldFocus,
    onFieldBlur,
    onPageChange,
    onFormComplete,
    onFormAbandon,
  }),
  [
    onFormStart,
    onFieldFocus,
    onFieldBlur,
    onPageChange,
    onFormComplete,
    onFormAbandon,
  ]
);

const analyticsTrackingForm = useFormedible({
  schema: analyticsTrackingSchema,
  fields: [
    { name: "email", type: "email", label: "Business Email", page: 1 },
    {
      name: "companySize",
      type: "select",
      label: "Company Size",
      page: 1,
      options: [
        { value: "1-10", label: "1-10 employees" },
        { value: "11-50", label: "11-50 employees" },
        { value: "51-200", label: "51-200 employees" },
        { value: "200+", label: "200+ employees" },
      ],
    },
    {
      name: "interests",
      type: "multiSelect",
      label: "Areas of Interest",
      page: 2,
      options: [
        { value: "web-dev", label: "Web Development" },
        { value: "mobile", label: "Mobile Apps" },
        { value: "ecommerce", label: "E-commerce" },
        { value: "analytics", label: "Analytics" },
        { value: "automation", label: "Automation" },
      ],
    },
    {
      name: "budget",
      type: "radio",
      label: "Project Budget",
      page: 2,
      options: [
        { value: "<10k", label: "Less than $10,000" },
        { value: "10k-50k", label: "$10,000 - $50,000" },
        { value: "50k-100k", label: "$50,000 - $100,000" },
        { value: "100k+", label: "$100,000+" },
      ],
    },
    {
      name: "timeline",
      type: "select",
      label: "Timeline",
      page: 3,
      options: ["ASAP", "1-3 months", "3-6 months", "6+ months"],
    },
    {
      name: "description",
      type: "textarea",
      label: "Project Description",
      page: 3,
      textareaConfig: { rows: 4, showWordCount: true, maxLength: 500 },
    },
  ],
  pages: [
    {
      page: 1,
      title: "Company Info",
      description: "Tell us about your company",
    },
    {
      page: 2,
      title: "Project Details",
      description: "What are you looking for?",
    },
    {
      page: 3,
      title: "Timeline & Details",
      description: "When do you need this?",
    },
  ],
  progress: { showSteps: true, showPercentage: true },
  analytics: analyticsConfig,
  formOptions: {
    defaultValues: {
      email: "",
      companySize: "1-10" as const,
      interests: [],
      budget: "10k-50k" as const,
      timeline: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      console.log("Analytics form submitted:", value);
      toast.success("Form submitted successfully!");
    },
  },
});`;

export function AnalyticsTrackingFormExample() {
  // Analytics callbacks - memoized to prevent re-renders
  const onFormStart = React.useCallback((timestamp: number) => {
    console.log("📊 Form started at:", new Date(timestamp).toISOString());
  }, []);

  const onFieldFocus = React.useCallback(
    (fieldName: string, timestamp: number) => {
      console.log(
        `👁️ Field "${fieldName}" focused at:`,
        new Date(timestamp).toISOString()
      );
    },
    []
  );

  const onFieldBlur = React.useCallback(
    (fieldName: string, timeSpent: number) => {
      console.log(`⏱️ Field "${fieldName}" completed in ${timeSpent}ms`);
    },
    []
  );

  const onPageChange = React.useCallback(
    (fromPage: number, toPage: number, timeSpent: number) => {
      console.log(`📄 Page ${fromPage} → ${toPage} (spent ${timeSpent}ms)`);
    },
    []
  );

  const onFormComplete = React.useCallback(
    (timeSpent: number, formData: any) => {
      console.log(`✅ Form completed in ${timeSpent}ms with data:`, formData);
      toast.success("Analytics form completed!", {
        description: `Total time: ${(timeSpent / 1000).toFixed(
          1
        )}s - Check console for full analytics`,
      });
    },
    []
  );

  const onFormAbandon = React.useCallback((completionPercentage: number) => {
    console.log(`❌ Form abandoned at ${completionPercentage}% completion`);
  }, []);

  // Memoize the analytics object
  const analyticsConfig = React.useMemo(
    () => ({
      onFormStart,
      onFieldFocus,
      onFieldBlur,
      onPageChange,
      onFormComplete,
      onFormAbandon,
    }),
    [
      onFormStart,
      onFieldFocus,
      onFieldBlur,
      onPageChange,
      onFormComplete,
      onFormAbandon,
    ]
  );

  const analyticsTrackingForm = useFormedible({
    schema: analyticsTrackingSchema,
    fields: [
      { name: "email", type: "email", label: "Business Email", page: 1 },
      {
        name: "companySize",
        type: "select",
        label: "Company Size",
        page: 1,
        options: [
          { value: "1-10", label: "1-10 employees" },
          { value: "11-50", label: "11-50 employees" },
          { value: "51-200", label: "51-200 employees" },
          { value: "200+", label: "200+ employees" },
        ],
      },
      {
        name: "interests",
        type: "multiSelect",
        label: "Areas of Interest",
        page: 2,
        options: [
          { value: "web-dev", label: "Web Development" },
          { value: "mobile", label: "Mobile Apps" },
          { value: "ecommerce", label: "E-commerce" },
          { value: "analytics", label: "Analytics" },
          { value: "automation", label: "Automation" },
        ],
      },
      {
        name: "budget",
        type: "radio",
        label: "Project Budget",
        page: 2,
        options: [
          { value: "<10k", label: "Less than $10,000" },
          { value: "10k-50k", label: "$10,000 - $50,000" },
          { value: "50k-100k", label: "$50,000 - $100,000" },
          { value: "100k+", label: "$100,000+" },
        ],
      },
      {
        name: "timeline",
        type: "select",
        label: "Timeline",
        page: 3,
        options: ["ASAP", "1-3 months", "3-6 months", "6+ months"],
      },
      {
        name: "description",
        type: "textarea",
        label: "Project Description",
        page: 3,
        textareaConfig: { rows: 4, showWordCount: true, maxLength: 500 },
      },
    ],
    pages: [
      {
        page: 1,
        title: "Company Info",
        description: "Tell us about your company",
      },
      {
        page: 2,
        title: "Project Details",
        description: "What are you looking for?",
      },
      {
        page: 3,
        title: "Timeline & Details",
        description: "When do you need this?",
      },
    ],
    progress: { showSteps: true, showPercentage: true },
    analytics: analyticsConfig,
    formOptions: {
      defaultValues: {
        email: "",
        companySize: "1-10" as const,
        interests: [],
        budget: "10k-50k" as const,
        timeline: "",
        description: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Analytics form submitted:", value);
        toast.success("Form submitted successfully!");
      },
    },
  });

  return <analyticsTrackingForm.Form className="space-y-4" />;
}
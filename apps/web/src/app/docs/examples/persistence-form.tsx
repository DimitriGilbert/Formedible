"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const persistenceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().min(1, "Company is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  projectType: z.array(z.string()).min(1, "Select at least one project type"),
  timeline: z.string().min(1, "Timeline is required"),
  budget: z.string().min(1, "Budget is required"),
  description: z.string().min(50, "Please provide at least 50 characters"),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to terms"),
});

export const persistenceFormCode = `const persistenceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().min(1, "Company is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  projectType: z.array(z.string()).min(1, "Select at least one project type"),
  timeline: z.string().min(1, "Timeline is required"),
  budget: z.string().min(1, "Budget is required"),
  description: z.string().min(50, "Please provide at least 50 characters"),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to terms"),
});

const persistenceForm = useFormedible({
  schema: persistenceFormSchema,
  fields: [
    {
      name: "name",
      type: "text",
      label: "Full Name",
      page: 1,
      section: {
        title: "Contact Information",
        description: "Your basic details",
      },
    },
    { name: "email", type: "email", label: "Email Address", page: 1 },
    { name: "phone", type: "phone", label: "Phone Number", page: 1 },
    { name: "company", type: "text", label: "Company Name", page: 1 },
    { name: "jobTitle", type: "text", label: "Job Title", page: 1 },
    {
      name: "projectType",
      type: "multiSelect",
      label: "Project Type",
      page: 2,
      section: {
        title: "Project Requirements",
        description: "What do you need help with?",
      },
      options: [
        { value: "web-dev", label: "Web Development" },
        { value: "mobile-app", label: "Mobile App" },
        { value: "ecommerce", label: "E-commerce Platform" },
        { value: "api", label: "API Development" },
        { value: "consulting", label: "Technical Consulting" },
      ],
      multiSelectConfig: { searchable: true, maxSelections: 3 },
    },
    {
      name: "timeline",
      type: "select",
      label: "Timeline",
      page: 2,
      options: ["ASAP", "1-3 months", "3-6 months", "6+ months", "Flexible"],
    },
    {
      name: "budget",
      type: "radio",
      label: "Budget Range",
      page: 2,
      options: [
        { value: "<25k", label: "Less than $25,000" },
        { value: "25k-75k", label: "$25,000 - $75,000" },
        { value: "75k-150k", label: "$75,000 - $150,000" },
        { value: "150k+", label: "$150,000+" },
      ],
    },
    {
      name: "description",
      type: "textarea",
      label: "Project Description",
      page: 3,
      section: {
        title: "Project Details",
        description: "Tell us more about your project",
      },
      textareaConfig: { rows: 6, showWordCount: true, maxLength: 1000 },
    },
    {
      name: "agreeToTerms",
      type: "checkbox",
      label: "I agree to the terms of service and privacy policy",
      page: 3,
    },
  ],
  pages: [
    {
      page: 1,
      title: "Contact Information",
      description: "Let's start with your details",
    },
    {
      page: 2,
      title: "Project Requirements",
      description: "Tell us about your project",
    },
    { page: 3, title: "Final Details", description: "Complete your inquiry" },
  ],
  progress: { showSteps: true, showPercentage: true },
  persistence: {
    key: "demo-project-inquiry-form",
    storage: "localStorage",
    debounceMs: 1500,
    exclude: ["agreeToTerms"],
    restoreOnMount: true,
  },
  formOptions: {
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      projectType: [],
      timeline: "",
      budget: "",
      description: "",
      agreeToTerms: false,
    },
    onSubmit: async ({ value }) => {
      console.log("Persistence form submitted:", value);
      toast.success("Inquiry submitted!", {
        description:
          "Form data auto-saved throughout - try refreshing the page!",
      });
    },
  },
});`;

export function PersistenceFormExample() {
  const persistenceForm = useFormedible({
    schema: persistenceFormSchema,
    fields: [
      {
        name: "name",
        type: "text",
        label: "Full Name",
        page: 1,
        section: {
          title: "Contact Information",
          description: "Your basic details",
        },
      },
      { name: "email", type: "email", label: "Email Address", page: 1 },
      { name: "phone", type: "phone", label: "Phone Number", page: 1 },
      { name: "company", type: "text", label: "Company Name", page: 1 },
      { name: "jobTitle", type: "text", label: "Job Title", page: 1 },
      {
        name: "projectType",
        type: "multiSelect",
        label: "Project Type",
        page: 2,
        section: {
          title: "Project Requirements",
          description: "What do you need help with?",
        },
        options: [
          { value: "web-dev", label: "Web Development" },
          { value: "mobile-app", label: "Mobile App" },
          { value: "ecommerce", label: "E-commerce Platform" },
          { value: "api", label: "API Development" },
          { value: "consulting", label: "Technical Consulting" },
        ],
        multiSelectConfig: { searchable: true, maxSelections: 3 },
      },
      {
        name: "timeline",
        type: "select",
        label: "Timeline",
        page: 2,
        options: ["ASAP", "1-3 months", "3-6 months", "6+ months", "Flexible"],
      },
      {
        name: "budget",
        type: "radio",
        label: "Budget Range",
        page: 2,
        options: [
          { value: "<25k", label: "Less than $25,000" },
          { value: "25k-75k", label: "$25,000 - $75,000" },
          { value: "75k-150k", label: "$75,000 - $150,000" },
          { value: "150k+", label: "$150,000+" },
        ],
      },
      {
        name: "description",
        type: "textarea",
        label: "Project Description",
        page: 3,
        section: {
          title: "Project Details",
          description: "Tell us more about your project",
        },
        textareaConfig: { rows: 6, showWordCount: true, maxLength: 1000 },
      },
      {
        name: "agreeToTerms",
        type: "checkbox",
        label: "I agree to the terms of service and privacy policy",
        page: 3,
      },
    ],
    pages: [
      {
        page: 1,
        title: "Contact Information",
        description: "Let's start with your details",
      },
      {
        page: 2,
        title: "Project Requirements",
        description: "Tell us about your project",
      },
      { page: 3, title: "Final Details", description: "Complete your inquiry" },
    ],
    progress: { showSteps: true, showPercentage: true },
    persistence: {
      key: "demo-project-inquiry-form",
      storage: "localStorage",
      debounceMs: 1500,
      exclude: ["agreeToTerms"],
      restoreOnMount: true,
    },
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        projectType: [],
        timeline: "",
        budget: "",
        description: "",
        agreeToTerms: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Persistence form submitted:", value);
        toast.success("Inquiry submitted!", {
          description:
            "Form data auto-saved throughout - try refreshing the page!",
        });
      },
    },
  });

  return <persistenceForm.Form className="space-y-4" />;
}
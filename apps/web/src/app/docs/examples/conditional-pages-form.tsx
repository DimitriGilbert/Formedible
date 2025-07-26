"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const conditionalPagesSchema = z.object({
  applicationType: z.enum(["individual", "business"]),
  // Individual fields
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  dateOfBirth: z.date().optional(),
  personalId: z.string().min(1, "Personal ID is required").optional(),
  // Business fields
  companyName: z.string().min(1, "Company name is required").optional(),
  businessType: z.enum(["llc", "corporation", "partnership", "sole_proprietorship"]).optional(),
  taxId: z.string().min(1, "Tax ID is required").optional(),
  employeeCount: z.number().min(1, "Employee count is required").optional(),
  // Premium features (conditional)
  needsPremium: z.boolean().default(false),
  premiumFeatures: z.array(z.string()).optional(),
  premiumBudget: z.enum(["basic", "standard", "premium"]).optional(),
  // Contact info (always required)
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone number is required"),
  preferredContact: z.enum(["email", "phone", "both"]),
});

export const conditionalPagesFormCode = `const conditionalPagesSchema = z.object({
  applicationType: z.enum(["individual", "business"]),
  // Individual fields
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  dateOfBirth: z.date().optional(),
  personalId: z.string().min(1, "Personal ID is required").optional(),
  // Business fields
  companyName: z.string().min(1, "Company name is required").optional(),
  businessType: z.enum(["llc", "corporation", "partnership", "sole_proprietorship"]).optional(),
  taxId: z.string().min(1, "Tax ID is required").optional(),
  employeeCount: z.number().min(1, "Employee count is required").optional(),
  // Premium features (conditional)
  needsPremium: z.boolean().default(false),
  premiumFeatures: z.array(z.string()).optional(),
  premiumBudget: z.enum(["basic", "standard", "premium"]).optional(),
  // Contact info (always required)
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone number is required"),
  preferredContact: z.enum(["email", "phone", "both"]),
});

const conditionalPagesForm = useFormedible({
  schema: conditionalPagesSchema,
  fields: [
    // Page 1 - Application Type (always shown)
    {
      name: "applicationType",
      type: "radio",
      label: "Application Type",
      page: 1,
      options: [
        { value: "individual", label: "Individual Application" },
        { value: "business", label: "Business Application" },
      ],
    },

    // Page 2 - Individual Info (only shown for individual applications)
    {
      name: "firstName",
      type: "text",
      label: "First Name",
      page: 2,
      conditional: (values: any) => values.applicationType === "individual",
    },
    {
      name: "lastName",
      type: "text",
      label: "Last Name",
      page: 2,
      conditional: (values: any) => values.applicationType === "individual",
    },
    {
      name: "dateOfBirth",
      type: "date",
      label: "Date of Birth",
      page: 2,
      conditional: (values: any) => values.applicationType === "individual",
    },
    {
      name: "personalId",
      type: "text",
      label: "Personal ID / SSN",
      page: 2,
      placeholder: "XXX-XX-XXXX",
      conditional: (values: any) => values.applicationType === "individual",
    },

    // Page 3 - Business Info (only shown for business applications)
    {
      name: "companyName",
      type: "text",
      label: "Company Name",
      page: 3,
      conditional: (values: any) => values.applicationType === "business",
    },
    {
      name: "businessType",
      type: "select",
      label: "Business Type",
      page: 3,
      options: [
        { value: "llc", label: "Limited Liability Company (LLC)" },
        { value: "corporation", label: "Corporation" },
        { value: "partnership", label: "Partnership" },
        { value: "sole_proprietorship", label: "Sole Proprietorship" },
      ],
      conditional: (values: any) => values.applicationType === "business",
    },
    {
      name: "taxId",
      type: "text",
      label: "Tax ID / EIN",
      page: 3,
      placeholder: "XX-XXXXXXX",
      conditional: (values: any) => values.applicationType === "business",
    },
    {
      name: "employeeCount",
      type: "number",
      label: "Number of Employees",
      page: 3,
      min: 1,
      conditional: (values: any) => values.applicationType === "business",
    },

    // Page 4 - Premium Features Check (always shown)
    {
      name: "needsPremium",
      type: "checkbox",
      label: "I'm interested in premium features",
      page: 4,
      description: "Premium features include advanced analytics, priority support, and custom integrations",
    },

    // Page 5 - Premium Options (only shown if premium is selected)
    {
      name: "premiumFeatures",
      type: "multiSelect",
      label: "Which premium features interest you?",
      page: 5,
      options: [
        { value: "analytics", label: "Advanced Analytics Dashboard" },
        { value: "support", label: "Priority 24/7 Support" },
        { value: "integrations", label: "Custom API Integrations" },
        { value: "whitelabel", label: "White-label Solution" },
        { value: "sla", label: "Enterprise SLA" },
      ],
      conditional: (values: any) => values.needsPremium === true,
      multiSelectConfig: {
        searchable: true,
        maxSelections: 5,
      },
    },
    {
      name: "premiumBudget",
      type: "radio",
      label: "Budget Range for Premium Features",
      page: 5,
      options: [
        { value: "basic", label: "Basic ($99/month)" },
        { value: "standard", label: "Standard ($299/month)" },
        { value: "premium", label: "Premium ($599/month)" },
      ],
      conditional: (values: any) => values.needsPremium === true,
    },

    // Page 6 - Contact Information (always shown)
    {
      name: "email",
      type: "email",
      label: "Email Address",
      page: 6,
    },
    {
      name: "phone",
      type: "phone",
      label: "Phone Number",
      page: 6,
    },
    {
      name: "preferredContact",
      type: "radio",
      label: "Preferred Contact Method",
      page: 6,
      options: [
        { value: "email", label: "Email" },
        { value: "phone", label: "Phone" },
        { value: "both", label: "Both Email and Phone" },
      ],
    },
  ],
  pages: [
    {
      page: 1,
      title: "Application Type",
      description: "Choose your application type to get started",
    },
    {
      page: 2,
      title: "Personal Information",
      description: "Tell us about yourself",
      // This page is only shown for individual applications
      conditional: (values: any) => values.applicationType === "individual",
    },
    {
      page: 3,
      title: "Business Information",
      description: "Tell us about your business",
      // This page is only shown for business applications
      conditional: (values: any) => values.applicationType === "business",
    },
    {
      page: 4,
      title: "Premium Features",
      description: "Enhance your experience with premium features",
    },
    {
      page: 5,
      title: "Premium Options",
      description: "Customize your premium experience",
      // This page is only shown if premium is selected
      conditional: (values: any) => values.needsPremium === true,
    },
    {
      page: 6,
      title: "Contact Information",
      description: "How can we reach you?",
    },
  ],
  progress: { showSteps: true, showPercentage: true },
  formOptions: {
    defaultValues: {
      applicationType: "individual" as const,
      firstName: "",
      lastName: "",
      dateOfBirth: new Date(),
      personalId: "",
      companyName: "",
      businessType: "llc" as const,
      taxId: "",
      employeeCount: 1,
      needsPremium: false,
      premiumFeatures: [],
      premiumBudget: "basic" as const,
      email: "",
      phone: "",
      preferredContact: "email" as const,
    },
    onSubmit: async ({ value }) => {
      console.log("Conditional pages form submitted:", value);
      toast.success("Application submitted successfully!", {
        description: \`Your \${value.applicationType} application has been received and will be processed within 3-5 business days.\`,
      });
    },
  },
});`;

export function ConditionalPagesFormExample() {
  const conditionalPagesForm = useFormedible({
    schema: conditionalPagesSchema,
    fields: [
      // Page 1 - Application Type (always shown)
      {
        name: "applicationType",
        type: "radio",
        label: "Application Type",
        page: 1,
        options: [
          { value: "individual", label: "Individual Application" },
          { value: "business", label: "Business Application" },
        ],
      },

      // Page 2 - Individual Info (only shown for individual applications)
      {
        name: "firstName",
        type: "text",
        label: "First Name",
        page: 2,
        conditional: (values: any) => values.applicationType === "individual",
      },
      {
        name: "lastName",
        type: "text",
        label: "Last Name",
        page: 2,
        conditional: (values: any) => values.applicationType === "individual",
      },
      {
        name: "dateOfBirth",
        type: "date",
        label: "Date of Birth",
        page: 2,
        conditional: (values: any) => values.applicationType === "individual",
      },
      {
        name: "personalId",
        type: "text",
        label: "Personal ID / SSN",
        page: 2,
        placeholder: "XXX-XX-XXXX",
        conditional: (values: any) => values.applicationType === "individual",
      },

      // Page 3 - Business Info (only shown for business applications)
      {
        name: "companyName",
        type: "text",
        label: "Company Name",
        page: 3,
        conditional: (values: any) => values.applicationType === "business",
      },
      {
        name: "businessType",
        type: "select",
        label: "Business Type",
        page: 3,
        options: [
          { value: "llc", label: "Limited Liability Company (LLC)" },
          { value: "corporation", label: "Corporation" },
          { value: "partnership", label: "Partnership" },
          { value: "sole_proprietorship", label: "Sole Proprietorship" },
        ],
        conditional: (values: any) => values.applicationType === "business",
      },
      {
        name: "taxId",
        type: "text",
        label: "Tax ID / EIN",
        page: 3,
        placeholder: "XX-XXXXXXX",
        conditional: (values: any) => values.applicationType === "business",
      },
      {
        name: "employeeCount",
        type: "number",
        label: "Number of Employees",
        page: 3,
        min: 1,
        conditional: (values: any) => values.applicationType === "business",
      },

      // Page 4 - Premium Features Check (always shown)
      {
        name: "needsPremium",
        type: "checkbox",
        label: "I'm interested in premium features",
        page: 4,
        description: "Premium features include advanced analytics, priority support, and custom integrations",
      },

      // Page 5 - Premium Options (only shown if premium is selected)
      {
        name: "premiumFeatures",
        type: "multiSelect",
        label: "Which premium features interest you?",
        page: 5,
        options: [
          { value: "analytics", label: "Advanced Analytics Dashboard" },
          { value: "support", label: "Priority 24/7 Support" },
          { value: "integrations", label: "Custom API Integrations" },
          { value: "whitelabel", label: "White-label Solution" },
          { value: "sla", label: "Enterprise SLA" },
        ],
        conditional: (values: any) => values.needsPremium === true,
        multiSelectConfig: {
          searchable: true,
          maxSelections: 5,
        },
      },
      {
        name: "premiumBudget",
        type: "radio",
        label: "Budget Range for Premium Features",
        page: 5,
        options: [
          { value: "basic", label: "Basic ($99/month)" },
          { value: "standard", label: "Standard ($299/month)" },
          { value: "premium", label: "Premium ($599/month)" },
        ],
        conditional: (values: any) => values.needsPremium === true,
      },

      // Page 6 - Contact Information (always shown)
      {
        name: "email",
        type: "email",
        label: "Email Address",
        page: 6,
      },
      {
        name: "phone",
        type: "phone",
        label: "Phone Number",
        page: 6,
      },
      {
        name: "preferredContact",
        type: "radio",
        label: "Preferred Contact Method",
        page: 6,
        options: [
          { value: "email", label: "Email" },
          { value: "phone", label: "Phone" },
          { value: "both", label: "Both Email and Phone" },
        ],
      },
    ],
    pages: [
      {
        page: 1,
        title: "Application Type",
        description: "Choose your application type to get started",
      },
      {
        page: 2,
        title: "Personal Information",
        description: "Tell us about yourself",
        // This page is only shown for individual applications
        conditional: (values: any) => values.applicationType === "individual",
      },
      {
        page: 3,
        title: "Business Information",
        description: "Tell us about your business",
        // This page is only shown for business applications
        conditional: (values: any) => values.applicationType === "business",
      },
      {
        page: 4,
        title: "Premium Features",
        description: "Enhance your experience with premium features",
      },
      {
        page: 5,
        title: "Premium Options",
        description: "Customize your premium experience",
        // This page is only shown if premium is selected
        conditional: (values: any) => values.needsPremium === true,
      },
      {
        page: 6,
        title: "Contact Information",
        description: "How can we reach you?",
      },
    ],
    progress: { showSteps: true, showPercentage: true },
    formOptions: {
      defaultValues: {
        applicationType: "individual" as const,
        firstName: "",
        lastName: "",
        dateOfBirth: new Date(),
        personalId: "",
        companyName: "",
        businessType: "llc" as const,
        taxId: "",
        employeeCount: 1,
        needsPremium: false,
        premiumFeatures: [],
        premiumBudget: "basic" as const,
        email: "",
        phone: "",
        preferredContact: "email" as const,
      },
      onSubmit: async ({ value }) => {
        console.log("Conditional pages form submitted:", value);
        toast.success("Application submitted successfully!", {
          description: `Your ${value.applicationType} application has been received and will be processed within 3-5 business days.`,
        });
      },
    },
  });

  return <conditionalPagesForm.Form className="space-y-4" />;
}
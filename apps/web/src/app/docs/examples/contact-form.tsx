"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.enum(["general", "support", "sales"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
  categories: z.array(z.string()).optional(),
  urgent: z.boolean().default(false),
});

export const contactFormCode = `const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.enum(["general", "support", "sales"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
  categories: z.array(z.string()).optional(),
  urgent: z.boolean().default(false),
});

const contactForm = useFormedible({
  schema: contactSchema,
  fields: [
    {
      name: "name",
      type: "text",
      label: "Full Name",
      placeholder: "John Doe",
    },
    {
      name: "email",
      type: "email",
      label: "Email",
      placeholder: "john@example.com",
    },
    {
      name: "subject",
      type: "combobox",
      label: "Subject",
      options: [
        { value: "general", label: "General Inquiry" },
        { value: "support", label: "Technical Support" },
        { value: "sales", label: "Sales Question" },
        { value: "billing", label: "Billing Question" },
        { value: "feature", label: "Feature Request" },
      ],
      comboboxConfig: {
        searchable: true,
        placeholder: "Select subject...",
        searchPlaceholder: "Search subjects...",
        noOptionsText: "No subjects found."
      },
    },
    {
      name: "message",
      type: "textarea",
      label: "Message",
      placeholder: "How can we help?",
    },
    {
      name: "categories",
      type: "multicombobox",
      label: "Categories",
      options: [
        { value: "bug", label: "Bug Report" },
        { value: "feature", label: "Feature Request" },
        { value: "documentation", label: "Documentation" },
        { value: "performance", label: "Performance Issue" },
        { value: "security", label: "Security Concern" },
      ],
      multiComboboxConfig: {
        searchable: true,
        creatable: true,
        maxSelections: 3,
        placeholder: "Select categories...",
        searchPlaceholder: "Search categories...",
        noOptionsText: "No categories found."
      }
    },
    { name: "urgent", type: "checkbox", label: "This is urgent" },
  ],
  submitLabel: "Send Message",
  collapseLabel: "Hide",
  expandLabel: "Show",
  formOptions: {
    defaultValues: {
      name: "",
      email: "",
      subject: "general" as const,
      message: "",
      categories: [],
      urgent: false,
    },
    onSubmit: async ({ value }) => {
      console.log("Contact form submitted:", value);
      toast.success("Message sent successfully!", {
        description: "We'll get back to you soon.",
      });
    },
  },
});`;

export function ContactFormExample() {
  const contactForm = useFormedible({
    schema: contactSchema,
    fields: [
      {
        name: "name",
        type: "text",
        label: "Full Name",
        placeholder: "John Doe",
      },
      {
        name: "email",
        type: "email",
        label: "Email",
        placeholder: "john@example.com",
      },
      {
        name: "subject",
        type: "combobox",
        label: "Subject",
        options: [
          { value: "general", label: "General Inquiry" },
          { value: "support", label: "Technical Support" },
          { value: "sales", label: "Sales Question" },
          { value: "billing", label: "Billing Question" },
          { value: "feature", label: "Feature Request" },
        ],
        comboboxConfig: {
          searchable: true,
          placeholder: "Select subject...",
          searchPlaceholder: "Search subjects...",
          noOptionsText: "No subjects found."
        },
      },
      {
        name: "message",
        type: "textarea",
        label: "Message",
        placeholder: "How can we help?",
      },
      {
        name: "categories",
        type: "multicombobox",
        label: "Categories",
        options: [
          { value: "bug", label: "Bug Report" },
          { value: "feature", label: "Feature Request" },
          { value: "documentation", label: "Documentation" },
          { value: "performance", label: "Performance Issue" },
          { value: "security", label: "Security Concern" },
        ],
        multiComboboxConfig: {
          searchable: true,
          creatable: true,
          maxSelections: 3,
          placeholder: "Select categories...",
          searchPlaceholder: "Search categories...",
          noOptionsText: "No categories found."
        }
      },
      { name: "urgent", type: "checkbox", label: "This is urgent" },
    ],
    submitLabel: "Send Message",
    collapseLabel: "Hide",
    expandLabel: "Show",
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        subject: "general" as const,
        message: "",
        categories: [],
        urgent: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Contact form submitted:", value);
        toast.success("Message sent successfully!", {
          description: "We'll get back to you soon.",
        });
      },
    },
  });

  return <contactForm.Form className="space-y-4" />;
}
"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const jobApplicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  skills: z.array(z.string()).min(1),
  startDate: z.date(),
  salaryExpectation: z.number().min(0),
  whyInterested: z.string().min(10),
  additionalInfo: z.string().optional(),
});

export const jobApplicationFormCode = `const jobApplicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  skills: z.array(z.string()).min(1),
  startDate: z.date(),
  salaryExpectation: z.number().min(0),
  whyInterested: z.string().min(10),
  additionalInfo: z.string().optional(),
});

const jobApplicationForm = useFormedible({
  schema: jobApplicationSchema,
  fields: [
    // Page 1 - Personal Info
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", page: 1 },
    { name: "email", type: "email", label: "Email", page: 1 },
    { name: "phone", type: "phone", label: "Phone Number", page: 1 },

    // Page 2 - Skills & Experience
    {
      name: "skills",
      type: "multiSelect",
      label: "Technical Skills",
      page: 2,
      options: [
        { value: "javascript", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
        { value: "react", label: "React" },
        { value: "node", label: "Node.js" },
        { value: "python", label: "Python" },
        { value: "java", label: "Java" },
        { value: "sql", label: "SQL" },
        { value: "aws", label: "AWS" },
      ],
      multiSelectConfig: {
        searchable: true,
        creatable: true,
        maxSelections: 10,
      },
    },
    {
      name: "startDate",
      type: "date",
      label: "Available Start Date",
      page: 2,
    },
    {
      name: "salaryExpectation",
      type: "number",
      label: "Salary Expectation (USD)",
      page: 2,
      min: 0,
      step: 1000,
    },

    // Page 3 - Questions
    {
      name: "whyInterested",
      type: "textarea",
      label: "Why are you interested in this position?",
      page: 3,
    },
    {
      name: "additionalInfo",
      type: "textarea",
      label: "Additional Information",
      page: 3,
    },
  ],
  pages: [
    { page: 1, title: "Personal Information" },
    { page: 2, title: "Skills & Availability" },
    { page: 3, title: "Additional Questions" },
  ],
  progress: { showSteps: true, showPercentage: true },
  formOptions: {
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      skills: [],
      startDate: new Date(),
      salaryExpectation: 0,
      whyInterested: "",
      additionalInfo: "",
    },
    onSubmit: async ({ value }) => {
      console.log("Application submitted:", value);
      toast.success("Application submitted!", {
        description: "We'll review your application and get back to you soon.",
      });
    },
  },
});`;

export function JobApplicationFormExample() {
  const jobApplicationForm = useFormedible({
    schema: jobApplicationSchema,
    fields: [
      // Page 1 - Personal Info
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      { name: "email", type: "email", label: "Email", page: 1 },
      { name: "phone", type: "phone", label: "Phone Number", page: 1 },

      // Page 2 - Skills & Experience
      {
        name: "skills",
        type: "multiSelect",
        label: "Technical Skills",
        page: 2,
        options: [
          { value: "javascript", label: "JavaScript" },
          { value: "typescript", label: "TypeScript" },
          { value: "react", label: "React" },
          { value: "node", label: "Node.js" },
          { value: "python", label: "Python" },
          { value: "java", label: "Java" },
          { value: "sql", label: "SQL" },
          { value: "aws", label: "AWS" },
        ],
        multiSelectConfig: {
          searchable: true,
          creatable: true,
          maxSelections: 10,
        },
      },
      {
        name: "startDate",
        type: "date",
        label: "Available Start Date",
        page: 2,
      },
      {
        name: "salaryExpectation",
        type: "number",
        label: "Salary Expectation (USD)",
        page: 2,
        min: 0,
        step: 1000,
      },

      // Page 3 - Questions
      {
        name: "whyInterested",
        type: "textarea",
        label: "Why are you interested in this position?",
        page: 3,
      },
      {
        name: "additionalInfo",
        type: "textarea",
        label: "Additional Information",
        page: 3,
      },
    ],
    pages: [
      { page: 1, title: "Personal Information" },
      { page: 2, title: "Skills & Availability" },
      { page: 3, title: "Additional Questions" },
    ],
    progress: { showSteps: true, showPercentage: true },
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        skills: [],
        startDate: new Date(),
        salaryExpectation: 0,
        whyInterested: "",
        additionalInfo: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Application submitted:", value);
        toast.success("Application submitted!", {
          description:
            "We'll review your application and get back to you soon.",
        });
      },
    },
  });

  return <jobApplicationForm.Form className="space-y-4" />;
}
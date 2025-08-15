"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.date(),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number required"),
  address: z.string().min(5, "Address required"),
  newsletter: z.boolean(),
  notifications: z.boolean(),
  plan: z.enum(["basic", "pro", "enterprise"]),
});

export const registrationFormCode = `const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.date(),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number required"),
  address: z.string().min(5, "Address required"),
  newsletter: z.boolean(),
  notifications: z.boolean(),
  plan: z.enum(["basic", "pro", "enterprise"]),
});

const registrationForm = useFormedible({
  schema: registrationSchema,
  fields: [
    // Page 1
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", page: 1 },
    { name: "birthDate", type: "date", label: "Birth Date", page: 1 },

    // Page 2
    { name: "email", type: "email", label: "Email", page: 2 },
    { name: "phone", type: "phone", label: "Phone", page: 2 },
    { name: "address", type: "textarea", label: "Address", page: 2 },

    // Page 3
    {
      name: "newsletter",
      type: "switch",
      label: "Subscribe to newsletter",
      page: 3,
    },
    {
      name: "notifications",
      type: "switch",
      label: "Enable notifications",
      page: 3,
    },
    {
      name: "plan",
      type: "radio",
      label: "Choose Plan",
      page: 3,
      options: [
        { value: "basic", label: "Basic - Free" },
        { value: "pro", label: "Pro - $9/month" },
        { value: "enterprise", label: "Enterprise - $29/month" },
      ],
    },
  ],
  pages: [
    {
      page: 1,
      title: "Personal Information",
      description: "Tell us about yourself",
    },
    {
      page: 2,
      title: "Contact Details",
      description: "How can we reach you {{firstName}}?",
    },
    {
      page: 3,
      title: "Preferences",
      description: "Customize your experience",
    },
  ],
  progress: { showSteps: true, showPercentage: true },
  formOptions: {
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: new Date(),
      email: "",
      phone: "",
      address: "",
      newsletter: true,
      notifications: true,
      plan: "basic" as const,
    },
    onSubmit: async ({ value }) => {
      console.log("Registration completed:", value);
      toast.success("Registration completed!", {
        description: "Welcome to our platform!",
      });
    },
  },
});`;

export function RegistrationFormExample() {
  const registrationForm = useFormedible({
    schema: registrationSchema,
    fields: [
      // Page 1
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      { name: "birthDate", type: "date", label: "Birth Date", page: 1 },

      // Page 2
      { name: "email", type: "email", label: "Email", page: 2 },
      { name: "phone", type: "phone", label: "Phone", page: 2 },
      { name: "address", type: "textarea", label: "Address", page: 2 },

      // Page 3
      {
        name: "newsletter",
        type: "switch",
        label: "Subscribe to newsletter",
        page: 3,
      },
      {
        name: "notifications",
        type: "switch",
        label: "Enable notifications",
        page: 3,
      },
      {
        name: "plan",
        type: "radio",
        label: "Choose Plan",
        page: 3,
        options: [
          { value: "basic", label: "Basic - Free" },
          { value: "pro", label: "Pro - $9/month" },
          { value: "enterprise", label: "Enterprise - $29/month" },
        ],
      },
    ],
    pages: [
      {
        page: 1,
        title: "Personal Information",
        description: "Tell us about yourself",
      },
      {
        page: 2,
        title: "Contact Details",
        description: "How can we reach you {{firstName}} ?",
      },
      {
        page: 3,
        title: "Preferences",
        description: "Customize your experience",
      },
    ],
    progress: { showSteps: true, showPercentage: true },
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        birthDate: new Date(),
        email: "",
        phone: "",
        address: "",
        newsletter: true,
        notifications: true,
        plan: "basic" as const,
      },
      onSubmit: async ({ value }) => {
        console.log("Registration completed:", value);
        toast.success("Registration completed!", {
          description: "Welcome to our platform!",
        });
      },
    },
  });

  return <registrationForm.Form className="space-y-4" />;
}

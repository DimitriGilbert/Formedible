"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const tabbedFormSchema = z.object({
  // Personal tab
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),

  // Preferences tab
  theme: z.enum(["light", "dark", "auto"]),
  language: z.enum(["en", "es", "fr", "de"]),
  notifications: z.boolean(),
  newsletter: z.boolean(),

  // Settings tab
  privacy: z.enum(["public", "private", "friends"]),
  marketing: z.boolean(),
  analytics: z.boolean(),
  location: z.string().optional(),
});

export const tabbedFormCode = `const tabbedFormSchema = z.object({
  // Personal tab
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),

  // Preferences tab
  theme: z.enum(["light", "dark", "auto"]),
  language: z.enum(["en", "es", "fr", "de"]),
  notifications: z.boolean(),
  newsletter: z.boolean(),

  // Settings tab
  privacy: z.enum(["public", "private", "friends"]),
  marketing: z.boolean(),
  analytics: z.boolean(),
  location: z.string().optional(),
});

const tabbedForm = useFormedible({
  schema: tabbedFormSchema,
  fields: [
    // Personal tab
    { name: "firstName", type: "text", label: "First Name", tab: "personal" },
    { name: "lastName", type: "text", label: "Last Name", tab: "personal" },
    { name: "email", type: "email", label: "Email", tab: "personal" },
    { name: "phone", type: "phone", label: "Phone", tab: "personal" },

    // Preferences tab
    {
      name: "theme",
      type: "select",
      label: "Theme",
      tab: "preferences",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "auto", label: "Auto" },
      ],
    },
    {
      name: "language",
      type: "select",
      label: "Language",
      tab: "preferences",
      options: [
        { value: "en", label: "English" },
        { value: "es", label: "Spanish" },
        { value: "fr", label: "French" },
        { value: "de", label: "German" },
      ],
    },
    {
      name: "notifications",
      type: "switch",
      label: "Enable Notifications",
      tab: "preferences",
    },
    {
      name: "newsletter",
      type: "switch",
      label: "Subscribe to Newsletter",
      tab: "preferences",
    },

    // Settings tab
    {
      name: "privacy",
      type: "radio",
      label: "Privacy Setting",
      tab: "settings",
      options: [
        { value: "public", label: "Public" },
        { value: "private", label: "Private" },
        { value: "friends", label: "Friends Only" },
      ],
    },
    {
      name: "marketing",
      type: "checkbox",
      label: "Allow Marketing Emails",
      tab: "settings",
    },
    {
      name: "analytics",
      type: "checkbox",
      label: "Allow Analytics",
      tab: "settings",
    },
    {
      name: "location",
      type: "text",
      label: "Location (Optional)",
      tab: "settings",
    },
  ],
  tabs: [
    {
      id: "personal",
      label: "Personal Info",
      description: "Basic information about you",
    },
    {
      id: "preferences",
      label: "Preferences",
      description: "Your app preferences",
    },
    {
      id: "settings",
      label: "Settings",
      description: "Privacy and account settings",
    },
  ],
  formOptions: {
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      theme: "auto" as const,
      language: "en" as const,
      notifications: true,
      newsletter: false,
      privacy: "private" as const,
      marketing: false,
      analytics: true,
      location: "",
    },
    onSubmit: async ({ value }) => {
      console.log("Tabbed form submitted:", value);
      toast.success("Profile updated successfully!", {
        description: "Your settings have been saved.",
      });
    },
  },
});`;

export function TabbedFormExample() {
  const tabbedForm = useFormedible({
    schema: tabbedFormSchema,
    fields: [
      // Personal tab
      { name: "firstName", type: "text", label: "First Name", tab: "personal" },
      { name: "lastName", type: "text", label: "Last Name", tab: "personal" },
      { name: "email", type: "email", label: "Email", tab: "personal" },
      { name: "phone", type: "phone", label: "Phone", tab: "personal" },

      // Preferences tab
      {
        name: "theme",
        type: "select",
        label: "Theme",
        tab: "preferences",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "auto", label: "Auto" },
        ],
      },
      {
        name: "language",
        type: "select",
        label: "Language",
        tab: "preferences",
        options: [
          { value: "en", label: "English" },
          { value: "es", label: "Spanish" },
          { value: "fr", label: "French" },
          { value: "de", label: "German" },
        ],
      },
      {
        name: "notifications",
        type: "switch",
        label: "Enable Notifications",
        tab: "preferences",
      },
      {
        name: "newsletter",
        type: "switch",
        label: "Subscribe to Newsletter",
        tab: "preferences",
      },

      // Settings tab
      {
        name: "privacy",
        type: "radio",
        label: "Privacy Setting",
        tab: "settings",
        options: [
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
          { value: "friends", label: "Friends Only" },
        ],
      },
      {
        name: "marketing",
        type: "checkbox",
        label: "Allow Marketing Emails",
        tab: "settings",
      },
      {
        name: "analytics",
        type: "checkbox",
        label: "Allow Analytics",
        tab: "settings",
      },
      {
        name: "location",
        type: "text",
        label: "Location (Optional)",
        tab: "settings",
      },
    ],
    tabs: [
      {
        id: "personal",
        label: "Personal Info",
        description: "Basic information about you",
      },
      {
        id: "preferences",
        label: "Preferences",
        description: "Your app preferences",
      },
      {
        id: "settings",
        label: "Settings",
        description: "Privacy and account settings",
      },
    ],
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        theme: "auto" as const,
        language: "en" as const,
        notifications: true,
        newsletter: false,
        privacy: "private" as const,
        marketing: false,
        analytics: true,
        location: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Tabbed form submitted:", value);
        toast.success("Profile updated successfully!", {
          description: "Your settings have been saved.",
        });
      },
    },
  });

  return <tabbedForm.Form className="space-y-4" />;
}
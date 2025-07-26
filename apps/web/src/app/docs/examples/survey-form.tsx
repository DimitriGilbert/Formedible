"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const surveySchema = z.object({
  satisfaction: z.number().min(1).max(5),
  recommend: z.enum(["yes", "maybe", "no"]),
  improvements: z.string().optional(),
  referralSource: z.string().optional(),
  otherSource: z.string().optional(),
  features: z.array(z.string()),
  country: z.string().optional(),
  state: z.string().optional(),
});

export const surveyFormCode = `const surveySchema = z.object({
  satisfaction: z.number().min(1).max(5),
  recommend: z.enum(["yes", "maybe", "no"]),
  improvements: z.string().optional(),
  referralSource: z.string().optional(),
  otherSource: z.string().optional(),
  features: z.array(z.string()),
  country: z.string().optional(),
  state: z.string().optional(),
});

const surveyForm = useFormedible({
  schema: surveySchema,
  fields: [
    {
      name: "satisfaction",
      type: "rating",
      label: "How satisfied are you with our service?",
      ratingConfig: { max: 5, allowHalf: false, showValue: true },
    },
    {
      name: "recommend",
      type: "radio",
      label: "Would you recommend us to others?",
      options: [
        { value: "yes", label: "Yes, definitely" },
        { value: "maybe", label: "Maybe" },
        { value: "no", label: "No" },
      ],
    },
    {
      name: "improvements",
      type: "textarea",
      label: "What could we improve?",
      conditional: (values: any) => values.satisfaction < 4,
    },
    {
      name: "referralSource",
      type: "select",
      label: "How did you hear about us?",
      conditional: (values: any) => values.recommend === "yes",
      options: [
        { value: "friend", label: "Friend or colleague" },
        { value: "social", label: "Social media" },
        { value: "search", label: "Search engine" },
        { value: "ad", label: "Advertisement" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "otherSource",
      type: "text",
      label: "Please specify",
      conditional: (values: any) => values.referralSource === "other",
    },
    {
      name: "features",
      type: "multiSelect",
      label: "Which features do you use most?",
      options: [
        { value: "forms", label: "Form Builder" },
        { value: "validation", label: "Validation" },
        { value: "analytics", label: "Analytics" },
        { value: "integrations", label: "Integrations" },
        { value: "api", label: "API Access" },
      ],
      multiSelectConfig: {
        maxSelections: 3,
      },
    },
    {
      name: "country",
      type: "select",
      label: "Country",
      options: [
        { value: "us", label: "United States" },
        { value: "ca", label: "Canada" },
        { value: "uk", label: "United Kingdom" },
        { value: "au", label: "Australia" },
      ],
    },
    {
      name: "state",
      type: "select",
      label: "State/Province",
      conditional: (values: any) => !!values.country,
      options: (values: any) => {
        if (values.country === "us") {
          return [
            { value: "ca", label: "California" },
            { value: "ny", label: "New York" },
            { value: "tx", label: "Texas" },
            { value: "fl", label: "Florida" },
          ];
        } else if (values.country === "ca") {
          return [
            { value: "on", label: "Ontario" },
            { value: "qc", label: "Quebec" },
            { value: "bc", label: "British Columbia" },
            { value: "ab", label: "Alberta" },
          ];
        } else if (values.country === "uk") {
          return [
            { value: "england", label: "England" },
            { value: "scotland", label: "Scotland" },
            { value: "wales", label: "Wales" },
            { value: "ni", label: "Northern Ireland" },
          ];
        } else if (values.country === "au") {
          return [
            { value: "nsw", label: "New South Wales" },
            { value: "vic", label: "Victoria" },
            { value: "qld", label: "Queensland" },
            { value: "wa", label: "Western Australia" },
          ];
        }
        return [];
      },
    },
  ],
  formOptions: {
    defaultValues: {
      satisfaction: 5,
      recommend: "yes" as const,
      improvements: "",
      referralSource: "",
      otherSource: "",
      features: [],
      country: "",
      state: "",
    },
    onSubmit: async ({ value }) => {
      console.log("Survey submitted:", value);
      toast.success("Thank you for your feedback!", {
        description: "Your response helps us improve.",
      });
    },
  },
});`;

export function SurveyFormExample() {
  const surveyForm = useFormedible({
    schema: surveySchema,
    fields: [
      {
        name: "satisfaction",
        type: "rating",
        label: "How satisfied are you with our service?",
        ratingConfig: { max: 5, allowHalf: false, showValue: true },
      },
      {
        name: "recommend",
        type: "radio",
        label: "Would you recommend us to others?",
        options: [
          { value: "yes", label: "Yes, definitely" },
          { value: "maybe", label: "Maybe" },
          { value: "no", label: "No" },
        ],
      },
      {
        name: "improvements",
        type: "textarea",
        label: "What could we improve?",
        conditional: (values: any) => values.satisfaction < 4,
      },
      {
        name: "referralSource",
        type: "select",
        label: "How did you hear about us?",
        conditional: (values: any) => values.recommend === "yes",
        options: [
          { value: "friend", label: "Friend or colleague" },
          { value: "social", label: "Social media" },
          { value: "search", label: "Search engine" },
          { value: "ad", label: "Advertisement" },
          { value: "other", label: "Other" },
        ],
      },
      {
        name: "otherSource",
        type: "text",
        label: "Please specify",
        conditional: (values: any) => values.referralSource === "other",
      },
      {
        name: "features",
        type: "multiSelect",
        label: "Which features do you use most?",
        options: [
          { value: "forms", label: "Form Builder" },
          { value: "validation", label: "Validation" },
          { value: "analytics", label: "Analytics" },
          { value: "integrations", label: "Integrations" },
          { value: "api", label: "API Access" },
        ],
        multiSelectConfig: {
          maxSelections: 3,
        },
      },
      {
        name: "country",
        type: "select",
        label: "Country",
        options: [
          { value: "us", label: "United States" },
          { value: "ca", label: "Canada" },
          { value: "uk", label: "United Kingdom" },
          { value: "au", label: "Australia" },
        ],
      },
      {
        name: "state",
        type: "select",
        label: "State/Province",
        conditional: (values: any) => !!values.country,
        options: (values: any) => {
          if (values.country === "us") {
            return [
              { value: "ca", label: "California" },
              { value: "ny", label: "New York" },
              { value: "tx", label: "Texas" },
              { value: "fl", label: "Florida" },
            ];
          } else if (values.country === "ca") {
            return [
              { value: "on", label: "Ontario" },
              { value: "qc", label: "Quebec" },
              { value: "bc", label: "British Columbia" },
              { value: "ab", label: "Alberta" },
            ];
          } else if (values.country === "uk") {
            return [
              { value: "england", label: "England" },
              { value: "scotland", label: "Scotland" },
              { value: "wales", label: "Wales" },
              { value: "ni", label: "Northern Ireland" },
            ];
          } else if (values.country === "au") {
            return [
              { value: "nsw", label: "New South Wales" },
              { value: "vic", label: "Victoria" },
              { value: "qld", label: "Queensland" },
              { value: "wa", label: "Western Australia" },
            ];
          }
          return [];
        },
      },
    ],
    formOptions: {
      defaultValues: {
        satisfaction: 5,
        recommend: "yes" as const,
        improvements: "",
        referralSource: "",
        otherSource: "",
        features: [],
        country: "",
        state: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Survey submitted:", value);
        toast.success("Thank you for your feedback!", {
          description: "Your response helps us improve.",
        });
      },
    },
  });

  return <surveyForm.Form className="space-y-4" />;
}
"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { useFormedible } from "@formedible/ui/components/formedible/hooks/use-formedible";

export const arrayFieldsSchema = z.object({
  teamMembers: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email required"),
        role: z.enum(["developer", "designer", "manager", "qa"]),
        skills: z.array(z.string()),
        startDate: z.date(),
      })
    )
    .min(1, "At least one team member is required"),
  contactMethods: z
    .array(z.string().email("Must be valid email"))
    .min(1, "At least one contact method required"),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(1),
        relationship: z.string().min(1),
        phone: z.string().min(1),
        isPrimary: z.boolean(),
      })
    )
    .max(3, "Maximum 3 emergency contacts"),
});

type ArrayFieldsFormValues = z.infer<typeof arrayFieldsSchema>;

const savedTeamProfiles: ArrayFieldsFormValues[] = [];

async function saveTeamProfile(profile: ArrayFieldsFormValues) {
  savedTeamProfiles.push(profile);
}

export const arrayFieldsFormCode = `const arrayFieldsSchema = z.object({
  teamMembers: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email required"),
        role: z.enum(["developer", "designer", "manager", "qa"]),
        skills: z.array(z.string()),
        startDate: z.date(),
      })
    )
    .min(1, "At least one team member is required"),
  contactMethods: z
    .array(z.string().email("Must be valid email"))
    .min(1, "At least one contact method required"),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(1),
        relationship: z.string().min(1),
        phone: z.string().min(1),
        isPrimary: z.boolean(),
      })
    )
    .max(3, "Maximum 3 emergency contacts"),
});

type ArrayFieldsFormValues = z.infer<typeof arrayFieldsSchema>;

const savedTeamProfiles: ArrayFieldsFormValues[] = [];

async function saveTeamProfile(profile: ArrayFieldsFormValues) {
  savedTeamProfiles.push(profile);
}

export function ArrayFieldsFormExample() {
  const [formattedSubmission, setFormattedSubmission] = useState<string | null>(null);

  const arrayFieldsForm = useFormedible({
    schema: arrayFieldsSchema,
    fields: [
      {
        name: "teamMembers",
        type: "array",
        label: "Team Members",
        section: {
          title: "Team Composition",
          description: "Add your team members",
        },
        arrayConfig: {
          itemType: "object",
          itemLabel: "Team Member",
          minItems: 1,
          maxItems: 10,
          sortable: true,
          addButtonLabel: "Add Team Member",
          removeButtonLabel: "Remove Member",
          defaultValue: {
            name: "",
            email: "",
            role: "developer",
            skills: [],
            startDate: new Date(),
          },
          objectConfig: {
            fields: [
              {
                name: "name",
                type: "text",
                label: "Name",
                placeholder: "Enter name",
              },
              {
                name: "email",
                type: "email",
                label: "Email",
                placeholder: "Enter email",
              },
              {
                name: "role",
                type: "select",
                label: "Role",
                options: [
                  { value: "developer", label: "Developer" },
                  { value: "designer", label: "Designer" },
                  { value: "manager", label: "Manager" },
                  { value: "qa", label: "QA" },
                ],
              },
              {
                name: "skills",
                type: "array",
                label: "Skills",
                arrayConfig: {
                  itemType: "string",
                  itemLabel: "Skill",
                  itemPlaceholder: "TypeScript",
                  addButtonLabel: "Add Skill",
                  removeButtonLabel: "Remove Skill",
                  defaultValue: "",
                },
              },
              {
                name: "startDate",
                type: "date",
                label: "Start Date",
              },
            ],
          },
        },
      },
      {
        name: "contactMethods",
        type: "array",
        label: "Contact Email Addresses",
        section: {
          title: "Contact Information",
          description: "Primary and backup email addresses",
        },
        arrayConfig: {
          itemType: "email",
          itemLabel: "Email Address",
          itemPlaceholder: "contact@company.com",
          minItems: 1,
          maxItems: 5,
          addButtonLabel: "Add Email",
          removeButtonLabel: "Remove",
          defaultValue: "",
        },
      },
      {
        name: "emergencyContacts",
        type: "array",
        label: "Emergency Contacts",
        section: {
          title: "Emergency Information",
          description: "People to contact in case of emergency",
        },
        arrayConfig: {
          itemType: "object",
          itemLabel: "Emergency Contact",
          minItems: 0,
          maxItems: 3,
          addButtonLabel: "Add Emergency Contact",
          removeButtonLabel: "Remove Contact",
          defaultValue: {
            name: "",
            relationship: "",
            phone: "",
            isPrimary: false,
          },
          objectConfig: {
            fields: [
              {
                name: "name",
                type: "text",
                label: "Name",
                placeholder: "Enter name",
              },
              {
                name: "relationship",
                type: "text",
                label: "Relationship",
                placeholder: "e.g., Spouse, Parent",
              },
              {
                name: "phone",
                type: "text",
                label: "Phone",
                placeholder: "Enter phone number",
              },
              {
                name: "isPrimary",
                type: "checkbox",
                label: "Primary Contact",
              },
            ],
          },
        },
      },
    ],
    formOptions: {
      defaultValues: {
        teamMembers: [
          {
            name: "",
            email: "",
            role: "developer",
            skills: [],
            startDate: new Date(),
          },
        ],
        contactMethods: [""],
        emergencyContacts: [],
      },
      onSubmit: async ({ value }) => {
        await saveTeamProfile(value);

        const formatValue = (val: unknown): string => {
          if (val === null || val === undefined) return "null";
          if (typeof val === "boolean") return val.toString();
          if (typeof val === "number") return val.toString();
          if (typeof val === "string") return val;
          if (Array.isArray(val)) {
            return val
              .map((item) =>
                typeof item === "object"
                  ? JSON.stringify(item, null, 2)
                  : String(item)
              )
              .join("\\n");
          }
          if (typeof val === "object") {
            return JSON.stringify(val, null, 2);
          }
          return String(val);
        };

        const formattedData = Object.entries(value)
          .map(([key, val]) => \`\${key}: \${formatValue(val)}\`)
          .join("\\n\\n");

        toast.success("Team information saved!", {
          description: "Use the action to review the saved team details.",
          action: {
            label: "View Data",
            onClick: () => setFormattedSubmission(\`Form Data:\\n\\n\${formattedData}\`),
          },
        });
      },
    },
  });

  return <arrayFieldsForm.Form className="space-y-4" />;
}
`;

export function ArrayFieldsFormExample() {
  const [formattedSubmission, setFormattedSubmission] = useState<string | null>(null);

  const arrayFieldsForm = useFormedible<ArrayFieldsFormValues>({
    schema: arrayFieldsSchema,
    fields: [
      {
        name: "teamMembers",
        type: "array",
        label: "Team Members",
        section: {
          title: "Team Composition",
          description: "Add your team members",
        },
        arrayConfig: {
          itemType: "object",
          itemLabel: "Team Member",
          minItems: 1,
          maxItems: 10,
          sortable: true,
          addButtonLabel: "Add Team Member",
          removeButtonLabel: "Remove Member",
          defaultValue: {
            name: "",
            email: "",
            role: "developer",
            skills: [],
            startDate: new Date(),
          },
          objectConfig: {
            fields: [
              {
                name: "name",
                type: "text",
                label: "Name",
                placeholder: "Enter name",
              },
              {
                name: "email",
                type: "email",
                label: "Email",
                placeholder: "Enter email",
              },
              {
                name: "role",
                type: "select",
                label: "Role",
                options: [
                  { value: "developer", label: "Developer" },
                  { value: "designer", label: "Designer" },
                  { value: "manager", label: "Manager" },
                  { value: "qa", label: "QA" },
                ],
              },
              {
                name: "skills",
                type: "array",
                label: "Skills",
                arrayConfig: {
                  itemType: "string",
                  itemLabel: "Skill",
                  itemPlaceholder: "TypeScript",
                  addButtonLabel: "Add Skill",
                  removeButtonLabel: "Remove Skill",
                  defaultValue: "",
                },
              },
              {
                name: "startDate",
                type: "date",
                label: "Start Date",
              },
            ],
          },
        },
      },
      {
        name: "contactMethods",
        type: "array",
        label: "Contact Email Addresses",
        section: {
          title: "Contact Information",
          description: "Primary and backup email addresses",
        },
        arrayConfig: {
          itemType: "email",
          itemLabel: "Email Address",
          itemPlaceholder: "contact@company.com",
          minItems: 1,
          maxItems: 5,
          addButtonLabel: "Add Email",
          removeButtonLabel: "Remove",
          defaultValue: "",
        },
      },
      {
        name: "emergencyContacts",
        type: "array",
        label: "Emergency Contacts",
        section: {
          title: "Emergency Information",
          description: "People to contact in case of emergency",
        },
        arrayConfig: {
          itemType: "object",
          itemLabel: "Emergency Contact",
          minItems: 0,
          maxItems: 3,
          addButtonLabel: "Add Emergency Contact",
          removeButtonLabel: "Remove Contact",
          defaultValue: {
            name: "",
            relationship: "",
            phone: "",
            isPrimary: false,
          },
          objectConfig: {
            fields: [
              {
                name: "name",
                type: "text",
                label: "Name",
                placeholder: "Enter name",
              },
              {
                name: "relationship",
                type: "text",
                label: "Relationship",
                placeholder: "e.g., Spouse, Parent",
              },
              {
                name: "phone",
                type: "text",
                label: "Phone",
                placeholder: "Enter phone number",
              },
              {
                name: "isPrimary",
                type: "checkbox",
                label: "Primary Contact",
              },
            ],
          },
        },
      },
    ],
    formOptions: {
      defaultValues: {
        teamMembers: [
          {
            name: "",
            email: "",
            role: "developer",
            skills: [],
            startDate: new Date(),
          },
        ],
        contactMethods: [""],
        emergencyContacts: [],
      },
      onSubmit: async ({ value }) => {
        await saveTeamProfile(value);

        // Format the array data for display
        const formatValue = (val: unknown): string => {
          if (val === null || val === undefined) return "null";
          if (typeof val === "boolean") return val.toString();
          if (typeof val === "number") return val.toString();
          if (typeof val === "string") return val;
          if (Array.isArray(val)) {
            return val
              .map((item) =>
                typeof item === "object"
                  ? JSON.stringify(item, null, 2)
                  : String(item)
              )
              .join("\n");
          }
          if (typeof val === "object") {
            return JSON.stringify(val, null, 2);
          }
          return String(val);
        };

        const formattedData = Object.entries(value)
          .map(([key, val]) => `${key}: ${formatValue(val)}`)
          .join("\n\n");

        toast.success("Team information saved!", {
          description: "Use the action to review the saved team details.",
          action: {
            label: "View Data",
            onClick: () => setFormattedSubmission(`Form Data:\n\n${formattedData}`),
          },
        });
      },
    },
  });

  return (
    <div className="space-y-4">
      <arrayFieldsForm.Form className="space-y-4" />
      {formattedSubmission ? (
        <pre className="rounded-md border bg-muted p-4 text-sm whitespace-pre-wrap" aria-live="polite">
          {formattedSubmission}
        </pre>
      ) : null}
    </div>
  );
}

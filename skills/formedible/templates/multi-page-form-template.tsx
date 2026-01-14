/**
 * Multi-Page Form Template
 * For multi-step wizards with progress tracking
 */

import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

// Step 1: Define schema for all pages
const schema = z.object({
  // Page 1: Personal Info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string(),

  // Page 2: Contact Details
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(5, "Address is required"),

  // Page 3: Preferences
  notifications: z.boolean(),
  newsletter: z.boolean(),
  interests: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

export function MultiPageForm() {
  const { Form } = useFormedible<FormValues>({
    schema,

    // Step 2: Define fields with page numbers
    fields: [
      // Page 1: Personal Information
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      {
        name: "dateOfBirth",
        type: "date",
        label: "Date of Birth",
        page: 1,
        dateConfig: {
          disableFutureDates: true,
        },
      },

      // Page 2: Contact Details
      {
        name: "email",
        type: "email",
        label: "Email Address",
        page: 2,
        description: "We'll contact you at {{firstName}}",
      },
      {
        name: "phone",
        type: "phone",
        label: "Phone Number",
        page: 2,
        phoneConfig: {
          format: "international",
          defaultCountry: "US",
        },
      },
      {
        name: "address",
        type: "textarea",
        label: "Address",
        page: 2,
        textareaConfig: {
          rows: 3,
        },
      },

      // Page 3: Preferences
      {
        name: "notifications",
        type: "switch",
        label: "Enable Notifications",
        page: 3,
      },
      {
        name: "newsletter",
        type: "checkbox",
        label: "Subscribe to Newsletter",
        page: 3,
      },
      {
        name: "interests",
        type: "multiSelect",
        label: "Areas of Interest",
        page: 3,
        options: [
          { value: "tech", label: "Technology" },
          { value: "design", label: "Design" },
          { value: "business", label: "Business" },
          { value: "marketing", label: "Marketing" },
        ],
        multiSelectConfig: {
          maxSelections: 3,
        },
      },
    ],

    // Step 3: Define page configuration
    pages: [
      {
        page: 1,
        title: "Personal Information",
        description: "Tell us about yourself",
      },
      {
        page: 2,
        title: "Contact Details",
        description: "How can we reach you, {{firstName}}?",
      },
      {
        page: 3,
        title: "Preferences",
        description: "Customize your experience",
      },
    ],

    // Step 4: Configure progress tracking
    progress: {
      showSteps: true,
      showPercentage: true,
      className: "mb-8",
    },

    // Step 5: Configure persistence
    persistence: {
      key: "multi-page-form",
      storage: "localStorage",
      restoreOnMount: true,
    },

    // Step 6: Add analytics
    analytics: {
      onFormStart: (timestamp) => console.log("Form started at", timestamp),
      onPageChange: (from, to, timeSpent) => {
        console.log(`Page ${from} → ${to} (${timeSpent}ms)`);
      },
      onFormComplete: (timeSpent, data) => {
        console.log("Form completed", { timeSpent, data });
      },
      onFormAbandon: (completion, context) => {
        console.log("Form abandoned", {
          completion,
          currentPage: context.currentPage,
        });
      },
    },

    // Step 7: Configure form submission
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        email: "",
        phone: "",
        address: "",
        notifications: true,
        newsletter: false,
        interests: [],
      },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
        // Handle submission
      },
    },

    // Customize button labels
    nextLabel: "Continue →",
    previousLabel: "← Back",
    submitLabel: "Complete Registration",
  });

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Registration Wizard</h1>
        <p className="text-muted-foreground">
          Complete all steps to register your account
        </p>
      </div>
      <Form />
    </div>
  );
}

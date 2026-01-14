/**
 * Formedible Form Template
 * Copy this template to quickly create a new form
 */

import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

// Step 1: Define your Zod schema
const schema = z.object({
  // Add your fields here
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
});

// Step 2: Infer TypeScript types
type FormValues = z.infer<typeof schema>;

export function MyForm() {
  // Step 3: Configure your form
  const { Form } = useFormedible<FormValues>({
    schema,

    // Step 4: Define your fields
    fields: [
      {
        name: "name",
        type: "text",
        label: "Full Name",
        placeholder: "John Doe",
        description: "Enter your full name",
      },
      {
        name: "email",
        type: "email",
        label: "Email Address",
        placeholder: "john@example.com",
        inlineValidation: {
          enabled: true,
          showSuccess: true,
        },
      },
    ],

    // Step 5: Configure form options
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
        // Handle submission here
      },
    },

    // Optional: Configure persistence
    persistence: {
      key: "my-form-draft",
      storage: "localStorage",
      restoreOnMount: true,
    },

    // Optional: Configure analytics
    analytics: {
      onFormStart: (timestamp) => console.log("Form started", timestamp),
      onFormComplete: (timeSpent, data) => console.log("Form completed", { timeSpent, data }),
    },
  });

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">My Form</h1>
      <Form />
    </div>
  );
}

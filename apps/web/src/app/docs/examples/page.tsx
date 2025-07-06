import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Examples - Formedible",
  description: "Real-world examples and use cases for Formedible forms including contact forms, registration, surveys, and more.",
};

export default function ExamplesPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Examples</h1>
          <p className="text-lg text-muted-foreground">
            Real-world examples and use cases demonstrating Formedible's capabilities 
            in various scenarios from simple contact forms to complex multi-step wizards.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Form</h2>
            <p className="mb-4">
              A simple contact form with validation, demonstrating basic field types and schema validation.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Complete Example</h3>
              <pre className="text-sm overflow-x-auto">
{`import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.enum(["general", "support", "sales"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
  urgent: z.boolean().default(false),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const { Form } = useFormedible<ContactFormValues>({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name", placeholder: "John Doe" },
      { name: "email", type: "email", label: "Email", placeholder: "john@example.com" },
      { 
        name: "subject", 
        type: "select", 
        label: "Subject",
        selectConfig: {
          options: [
            { value: "general", label: "General Inquiry" },
            { value: "support", label: "Technical Support" },
            { value: "sales", label: "Sales Question" }
          ]
        }
      },
      { name: "message", type: "textarea", label: "Message", placeholder: "How can we help?" },
      { name: "urgent", type: "checkbox", label: "This is urgent" },
    ],
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        subject: "general" as const,
        message: "",
        urgent: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
        // Handle form submission
        await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
      },
    },
  });

  return <Form />;
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Multi-Step Registration</h2>
            <p className="mb-4">
              A multi-page registration form with progress tracking and conditional fields.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Registration Wizard</h3>
              <pre className="text-sm overflow-x-auto">
{`const registrationSchema = z.object({
  // Page 1: Personal Info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.date(),
  
  // Page 2: Contact Details
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number required"),
  address: z.string().min(5, "Address required"),
  
  // Page 3: Preferences
  newsletter: z.boolean(),
  notifications: z.boolean(),
  plan: z.enum(["basic", "pro", "enterprise"]),
});

export function RegistrationForm() {
  const { Form } = useFormedible({
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
      { name: "newsletter", type: "switch", label: "Subscribe to newsletter", page: 3 },
      { name: "notifications", type: "switch", label: "Enable notifications", page: 3 },
      { 
        name: "plan", 
        type: "radio", 
        label: "Choose Plan", 
        page: 3,
        radioConfig: {
          options: [
            { value: "basic", label: "Basic - Free" },
            { value: "pro", label: "Pro - $9/month" },
            { value: "enterprise", label: "Enterprise - $29/month" }
          ]
        }
      },
    ],
    pages: [
      { page: 1, title: "Personal Information", description: "Tell us about yourself" },
      { page: 2, title: "Contact Details", description: "How can we reach you?" },
      { page: 3, title: "Preferences", description: "Customize your experience" },
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
        await registerUser(value);
      },
    },
  });

  return <Form />;
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Dynamic Survey Form</h2>
            <p className="mb-4">
              A survey form with conditional questions and dynamic field generation.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Conditional Survey</h3>
              <pre className="text-sm overflow-x-auto">
{`export function SurveyForm() {
  const { Form } = useFormedible({
    fields: [
      { 
        name: "satisfaction", 
        type: "rating", 
        label: "How satisfied are you with our service?",
        ratingConfig: { max: 5, allowHalf: false, showValue: true }
      },
      { 
        name: "recommend", 
        type: "radio", 
        label: "Would you recommend us to others?",
        radioConfig: {
          options: [
            { value: "yes", label: "Yes, definitely" },
            { value: "maybe", label: "Maybe" },
            { value: "no", label: "No" }
          ]
        }
      },
      {
        name: "improvements",
        type: "textarea",
        label: "What could we improve?",
        conditional: (values) => values.satisfaction < 4, // Only show if rating < 4
      },
      {
        name: "referralSource",
        type: "select",
        label: "How did you hear about us?",
        conditional: (values) => values.recommend === "yes",
        selectConfig: {
          options: [
            { value: "friend", label: "Friend or colleague" },
            { value: "social", label: "Social media" },
            { value: "search", label: "Search engine" },
            { value: "ad", label: "Advertisement" },
            { value: "other", label: "Other" }
          ]
        }
      },
      {
        name: "otherSource",
        type: "text",
        label: "Please specify",
        conditional: (values) => values.referralSource === "other",
      },
      {
        name: "features",
        type: "multiSelect",
        label: "Which features do you use most?",
        multiSelectConfig: {
          options: [
            { value: "forms", label: "Form Builder" },
            { value: "validation", label: "Validation" },
            { value: "analytics", label: "Analytics" },
            { value: "integrations", label: "Integrations" },
            { value: "api", label: "API Access" }
          ],
          maxSelections: 3
        }
      }
    ],
    formOptions: {
      defaultValues: {
        satisfaction: 5,
        recommend: "",
        improvements: "",
        referralSource: "",
        otherSource: "",
        features: [],
      },
      onSubmit: async ({ value }) => {
        await submitSurvey(value);
      },
    },
  });

  return <Form />;
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">E-commerce Checkout</h2>
            <p className="mb-4">
              A complete checkout form with address validation, payment details, and order summary.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Checkout Form</h3>
              <pre className="text-sm overflow-x-auto">
{`const checkoutSchema = z.object({
  // Shipping Information
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    address: z.string().min(5),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(5),
    country: z.string().min(1),
  }),
  
  // Billing Information
  sameAsBilling: z.boolean(),
  billingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    address: z.string().min(5),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(5),
    country: z.string().min(1),
  }).optional(),
  
  // Payment
  paymentMethod: z.enum(["card", "paypal", "apple_pay"]),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  
  // Order Options
  shippingMethod: z.enum(["standard", "express", "overnight"]),
  giftMessage: z.string().optional(),
});

export function CheckoutForm() {
  const { Form } = useFormedible({
    schema: checkoutSchema,
    fields: [
      // Shipping Address Section
      { name: "shippingAddress.firstName", type: "text", label: "First Name", page: 1 },
      { name: "shippingAddress.lastName", type: "text", label: "Last Name", page: 1 },
      { name: "shippingAddress.address", type: "text", label: "Address", page: 1 },
      { name: "shippingAddress.city", type: "text", label: "City", page: 1 },
      { name: "shippingAddress.state", type: "text", label: "State", page: 1 },
      { name: "shippingAddress.zipCode", type: "text", label: "ZIP Code", page: 1 },
      { 
        name: "shippingAddress.country", 
        type: "select", 
        label: "Country", 
        page: 1,
        selectConfig: {
          options: [
            { value: "US", label: "United States" },
            { value: "CA", label: "Canada" },
            { value: "UK", label: "United Kingdom" }
          ]
        }
      },
      
      // Billing Address
      { name: "sameAsBilling", type: "checkbox", label: "Billing address same as shipping", page: 2 },
      { 
        name: "billingAddress.firstName", 
        type: "text", 
        label: "Billing First Name", 
        page: 2,
        conditional: (values) => !values.sameAsBilling
      },
      // ... more billing fields with same conditional
      
      // Payment Method
      { 
        name: "paymentMethod", 
        type: "radio", 
        label: "Payment Method", 
        page: 3,
        radioConfig: {
          options: [
            { value: "card", label: "Credit/Debit Card" },
            { value: "paypal", label: "PayPal" },
            { value: "apple_pay", label: "Apple Pay" }
          ]
        }
      },
      {
        name: "cardNumber",
        type: "masked",
        label: "Card Number",
        page: 3,
        conditional: (values) => values.paymentMethod === "card",
        maskedInputConfig: {
          mask: "9999 9999 9999 9999",
          placeholder: "1234 5678 9012 3456"
        }
      },
      {
        name: "expiryDate",
        type: "masked",
        label: "Expiry Date",
        page: 3,
        conditional: (values) => values.paymentMethod === "card",
        maskedInputConfig: {
          mask: "99/99",
          placeholder: "MM/YY"
        }
      },
      
      // Shipping Options
      { 
        name: "shippingMethod", 
        type: "radio", 
        label: "Shipping Method", 
        page: 4,
        radioConfig: {
          options: [
            { value: "standard", label: "Standard (5-7 days) - Free" },
            { value: "express", label: "Express (2-3 days) - $9.99" },
            { value: "overnight", label: "Overnight - $24.99" }
          ]
        }
      },
      { name: "giftMessage", type: "textarea", label: "Gift Message (Optional)", page: 4 },
    ],
    pages: [
      { page: 1, title: "Shipping Address", description: "Where should we send your order?" },
      { page: 2, title: "Billing Address", description: "Billing information" },
      { page: 3, title: "Payment", description: "How would you like to pay?" },
      { page: 4, title: "Review & Submit", description: "Review your order" },
    ],
    progress: { showSteps: true },
    formOptions: {
      defaultValues: {
        shippingAddress: {
          firstName: "",
          lastName: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: "US",
        },
        sameAsBilling: true,
        paymentMethod: "card" as const,
        shippingMethod: "standard" as const,
        giftMessage: "",
      },
      onSubmit: async ({ value }) => {
        await processOrder(value);
      },
    },
  });

  return <Form />;
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Job Application Form</h2>
            <p className="mb-4">
              A comprehensive job application form with file uploads, work history, and references.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Application Form</h3>
              <pre className="text-sm overflow-x-auto">
{`export function JobApplicationForm() {
  const { Form } = useFormedible({
    fields: [
      // Personal Information
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      { name: "email", type: "email", label: "Email", page: 1 },
      { name: "phone", type: "phone", label: "Phone Number", page: 1 },
      { name: "location", type: "location", label: "Current Location", page: 1 },
      
      // Documents
      { 
        name: "resume", 
        type: "file", 
        label: "Resume", 
        page: 2,
        fileConfig: {
          accept: ".pdf,.doc,.docx",
          maxSize: 5 * 1024 * 1024, // 5MB
          required: true
        }
      },
      { 
        name: "coverLetter", 
        type: "file", 
        label: "Cover Letter (Optional)", 
        page: 2,
        fileConfig: {
          accept: ".pdf,.doc,.docx",
          maxSize: 5 * 1024 * 1024
        }
      },
      { 
        name: "portfolio", 
        type: "file", 
        label: "Portfolio/Work Samples", 
        page: 2,
        fileConfig: {
          accept: ".pdf,.zip,.jpg,.png",
          maxSize: 10 * 1024 * 1024,
          multiple: true
        }
      },
      
      // Work Experience (Array Field)
      {
        name: "workExperience",
        type: "array",
        label: "Work Experience",
        page: 3,
        arrayConfig: {
          itemType: "object",
          minItems: 1,
          maxItems: 5,
          addButtonLabel: "Add Work Experience",
          fields: [
            { name: "company", type: "text", label: "Company" },
            { name: "position", type: "text", label: "Position" },
            { name: "startDate", type: "date", label: "Start Date" },
            { name: "endDate", type: "date", label: "End Date" },
            { name: "current", type: "checkbox", label: "Current Position" },
            { name: "description", type: "textarea", label: "Job Description" }
          ]
        }
      },
      
      // Skills
      {
        name: "skills",
        type: "multiSelect",
        label: "Technical Skills",
        page: 4,
        multiSelectConfig: {
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
          searchable: true,
          creatable: true,
          maxSelections: 10
        }
      },
      
      // Availability
      { 
        name: "startDate", 
        type: "date", 
        label: "Available Start Date", 
        page: 4 
      },
      { 
        name: "salaryExpectation", 
        type: "number", 
        label: "Salary Expectation (USD)", 
        page: 4,
        numberConfig: {
          min: 0,
          step: 1000
        }
      },
      
      // Additional Questions
      { 
        name: "whyInterested", 
        type: "textarea", 
        label: "Why are you interested in this position?", 
        page: 5 
      },
      { 
        name: "additionalInfo", 
        type: "textarea", 
        label: "Additional Information", 
        page: 5 
      },
    ],
    pages: [
      { page: 1, title: "Personal Information" },
      { page: 2, title: "Documents" },
      { page: 3, title: "Work Experience" },
      { page: 4, title: "Skills & Availability" },
      { page: 5, title: "Additional Questions" },
    ],
    progress: { showSteps: true, showPercentage: true },
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        location: null,
        workExperience: [{}],
        skills: [],
        startDate: new Date(),
        salaryExpectation: 0,
        whyInterested: "",
        additionalInfo: "",
      },
      onSubmit: async ({ value }) => {
        await submitApplication(value);
      },
    },
  });

  return <Form />;
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">Form Structure</h3>
                <p className="text-sm text-muted-foreground">
                  Break complex forms into logical sections or pages. Use clear labels and helpful descriptions.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold">Validation Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  Combine client-side validation with server-side validation. Provide immediate feedback for better UX.
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold">Progressive Enhancement</h3>
                <p className="text-sm text-muted-foreground">
                  Use conditional fields to show relevant questions only. Implement auto-save for long forms.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold">Accessibility</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure proper labeling, keyboard navigation, and screen reader support for all form elements.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
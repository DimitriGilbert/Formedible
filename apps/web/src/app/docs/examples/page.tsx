"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";

// Schemas
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.enum(["general", "support", "sales"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
  urgent: z.boolean().default(false),
});

const registrationSchema = z.object({
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

const surveySchema = z.object({
  satisfaction: z.number().min(1).max(5),
  recommend: z.enum(["yes", "maybe", "no"]),
  improvements: z.string().optional(),
  referralSource: z.string().optional(),
  otherSource: z.string().optional(),
  features: z.array(z.string()),
});

const checkoutSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(1),
  zipCode: z.string().min(5),
  paymentMethod: z.enum(["card", "paypal", "apple_pay"]),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  shippingMethod: z.enum(["standard", "express", "overnight"]),
  giftMessage: z.string().optional(),
});

const jobApplicationSchema = z.object({
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

export default function ExamplesPage() {
  // Contact Form
  const contactForm = useFormedible({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name", placeholder: "John Doe" },
      { name: "email", type: "email", label: "Email", placeholder: "john@example.com" },
      { 
        name: "subject", 
        type: "select", 
        label: "Subject",
        options: [
          { value: "general", label: "General Inquiry" },
          { value: "support", label: "Technical Support" },
          { value: "sales", label: "Sales Question" }
        ]
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
        console.log("Contact form submitted:", value);
        toast.success("Message sent successfully!", {
          description: "We'll get back to you soon.",
        });
      },
    },
  });

  // Registration Form
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
      { name: "newsletter", type: "switch", label: "Subscribe to newsletter", page: 3 },
      { name: "notifications", type: "switch", label: "Enable notifications", page: 3 },
      { 
        name: "plan", 
        type: "radio", 
        label: "Choose Plan", 
        page: 3,
        options: [
          { value: "basic", label: "Basic - Free" },
          { value: "pro", label: "Pro - $9/month" },
          { value: "enterprise", label: "Enterprise - $29/month" }
        ]
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
        console.log("Registration completed:", value);
        toast.success("Registration completed!", {
          description: "Welcome to our platform!",
        });
      },
    },
  });

  // Survey Form
  const surveyForm = useFormedible({
    schema: surveySchema,
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
        options: [
          { value: "yes", label: "Yes, definitely" },
          { value: "maybe", label: "Maybe" },
          { value: "no", label: "No" }
        ]
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
          { value: "other", label: "Other" }
        ]
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
          { value: "api", label: "API Access" }
        ],
        multiSelectConfig: {
          maxSelections: 3
        }
      }
    ],
    formOptions: {
      defaultValues: {
        satisfaction: 5,
        recommend: "yes" as const,
        improvements: "",
        referralSource: "",
        otherSource: "",
        features: [],
      },
      onSubmit: async ({ value }) => {
        console.log("Survey submitted:", value);
        toast.success("Thank you for your feedback!", {
          description: "Your response helps us improve.",
        });
      },
    },
  });

  // Checkout Form
  const checkoutForm = useFormedible({
    schema: checkoutSchema,
    fields: [
      // Page 1 - Shipping
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      { name: "email", type: "email", label: "Email", page: 1 },
      { name: "address", type: "text", label: "Address", page: 1 },
      { name: "city", type: "text", label: "City", page: 1 },
      { name: "zipCode", type: "text", label: "ZIP Code", page: 1 },
      
      // Page 2 - Payment
      { 
        name: "paymentMethod", 
        type: "radio", 
        label: "Payment Method", 
        page: 2,
        options: [
          { value: "card", label: "Credit/Debit Card" },
          { value: "paypal", label: "PayPal" },
          { value: "apple_pay", label: "Apple Pay" }
        ]
      },
      {
        name: "cardNumber",
        type: "text",
        label: "Card Number",
        page: 2,
        conditional: (values: any) => values.paymentMethod === "card",
        placeholder: "1234 5678 9012 3456"
      },
      {
        name: "expiryDate",
        type: "text",
        label: "Expiry Date",
        page: 2,
        conditional: (values: any) => values.paymentMethod === "card",
        placeholder: "MM/YY"
      },
      
      // Page 3 - Shipping Options
      { 
        name: "shippingMethod", 
        type: "radio", 
        label: "Shipping Method", 
        page: 3,
        options: [
          { value: "standard", label: "Standard (5-7 days) - Free" },
          { value: "express", label: "Express (2-3 days) - $9.99" },
          { value: "overnight", label: "Overnight - $24.99" }
        ]
      },
      { name: "giftMessage", type: "textarea", label: "Gift Message (Optional)", page: 3 },
    ],
    pages: [
      { page: 1, title: "Shipping Address", description: "Where should we send your order?" },
      { page: 2, title: "Payment", description: "How would you like to pay?" },
      { page: 3, title: "Review & Submit", description: "Review your order" },
    ],
    progress: { showSteps: true },
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        city: "",
        zipCode: "",
        paymentMethod: "card" as const,
        cardNumber: "",
        expiryDate: "",
        shippingMethod: "standard" as const,
        giftMessage: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Order submitted:", value);
        toast.success("Order placed successfully!", {
          description: "You'll receive a confirmation email shortly.",
        });
      },
    },
  });

  // Job Application Form
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
          maxSelections: 10
        }
      },
      { name: "startDate", type: "date", label: "Available Start Date", page: 2 },
      { 
        name: "salaryExpectation", 
        type: "number", 
        label: "Salary Expectation (USD)", 
        page: 2,
        min: 0,
        step: 1000
      },
      
      // Page 3 - Questions
      { 
        name: "whyInterested", 
        type: "textarea", 
        label: "Why are you interested in this position?", 
        page: 3 
      },
      { 
        name: "additionalInfo", 
        type: "textarea", 
        label: "Additional Information", 
        page: 3 
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
  });

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-4">Interactive Examples</h1>
            <p className="text-lg text-muted-foreground">
              Real-world examples demonstrating Formedible's capabilities with working forms.
              Try them out to see the features in action!
            </p>
          </motion.div>

          <Tabs defaultValue="contact" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="contact">Contact Form</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="survey">Survey</TabsTrigger>
              <TabsTrigger value="checkout">Checkout</TabsTrigger>
              <TabsTrigger value="job">Job Application</TabsTrigger>
            </TabsList>

            <TabsContent value="contact">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Contact Form
                      <Badge variant="secondary">Basic</Badge>
                    </CardTitle>
                    <CardDescription>
                      A simple contact form with validation, demonstrating basic field types and schema validation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <contactForm.Form className="space-y-4" />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="registration">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Multi-Step Registration
                      <Badge variant="secondary">Multi-Page</Badge>
                    </CardTitle>
                    <CardDescription>
                      A multi-page registration form with progress tracking and various field types.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <registrationForm.Form className="space-y-4" />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="survey">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Dynamic Survey Form
                      <Badge variant="secondary">Conditional</Badge>
                    </CardTitle>
                    <CardDescription>
                      A survey form with conditional questions that appear based on previous answers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <surveyForm.Form className="space-y-4" />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="checkout">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      E-commerce Checkout
                      <Badge variant="secondary">Complex</Badge>
                    </CardTitle>
                    <CardDescription>
                      A complete checkout form with shipping, payment, and order options across multiple pages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <checkoutForm.Form className="space-y-4" />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="job">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Job Application Form
                      <Badge variant="secondary">Advanced</Badge>
                    </CardTitle>
                    <CardDescription>
                      A comprehensive job application form with skills selection, availability, and open-ended questions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <jobApplicationForm.Form className="space-y-4" />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </>
  );
}
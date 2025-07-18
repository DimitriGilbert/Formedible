"use client";

import React from "react";
import { useFormedible, type FieldConfig } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

// Components
import { DemoCard } from "@/components/demo/demo-card";

// Code examples
import {
  exampleContactFormCode,
  exampleRegistrationFormCode,
  exampleSurveyFormCode,
  exampleCheckoutFormCode,
  exampleJobApplicationFormCode,
  analyticsTrackingFormCode,
  persistenceFormCode,
  arrayFieldsCode,
  advancedFieldTypesCode,
} from "@/data/code-examples";

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
  country: z.string().optional(),
  state: z.string().optional(),
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

const tabbedFormSchema = z.object({
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

// Advanced Examples Schemas
const analyticsTrackingSchema = z.object({
  email: z.string().email("Valid email required"),
  companySize: z.enum(["1-10", "11-50", "51-200", "200+"]),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  budget: z.enum(["<10k", "10k-50k", "50k-100k", "100k+"]),
  timeline: z.string().min(1, "Timeline is required"),
  description: z.string().min(20, "Please provide more details"),
});

const persistenceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().min(1, "Company is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  projectType: z.array(z.string()).min(1, "Select at least one project type"),
  timeline: z.string().min(1, "Timeline is required"),
  budget: z.string().min(1, "Budget is required"),
  description: z.string().min(50, "Please provide at least 50 characters"),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to terms"),
});

const arrayFieldsSchema = z.object({
  teamMembers: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    role: z.enum(["developer", "designer", "manager", "qa"]),
    skills: z.array(z.string()),
    startDate: z.date(),
  })).min(1, "At least one team member is required"),
  contactMethods: z.array(z.string().email("Must be valid email")).min(1, "At least one contact method required"),
  emergencyContacts: z.array(z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(1),
    isPrimary: z.boolean()
  })).max(3, "Maximum 3 emergency contacts"),
});

const advancedFieldTypesSchema = z.object({
  satisfaction: z.number().min(1).max(5),
  phoneNumber: z.string().min(1, "Phone number is required"),
  favoriteColor: z.string().min(1, "Please select a color"),
  workLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  workDuration: z.object({
    hours: z.number().min(0),
    minutes: z.number().min(0),
  }).optional(),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  experienceLevel: z.number().min(1).max(10),
  energyRating: z.number().min(1).max(5),
  performanceLevel: z.number().min(0).max(100),
  birthDate: z.date(),
  resume: z.any().optional(),
  aboutMe: z.string().min(50, "Please write at least 50 characters about yourself"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workEmail: z.string().email("Valid work email required"),
  overallRating: z.number().min(1).max(5),
});

// Energy Rating Visualization Component
const EnergyRatingComponent: React.FC<{
  value: number;
  displayValue: string | number;
  label?: string;
  isActive: boolean;
}> = ({ value, displayValue, label, isActive }) => (
  <div className={`flex flex-col items-center p-2 rounded-lg transition-all ${
    isActive 
      ? 'bg-primary text-primary-foreground scale-110' 
      : 'bg-muted text-muted-foreground hover:bg-muted/80'
  }`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
      value <= 2 ? 'bg-red-500' : value <= 3 ? 'bg-yellow-500' : 'bg-green-500'
    }`}>
      {displayValue}
    </div>
    {label && <span className="text-xs mt-1">{label}</span>}
  </div>
);

export default function ExamplesPage() {
  // Contact Form with translation support
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
    // Translation support for buttons
    submitLabel: "Send Message",
    collapseLabel: "Hide",
    expandLabel: "Show",
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
      },
      {
        name: "country",
        type: "select",
        label: "Country",
        options: [
          { value: "us", label: "United States" },
          { value: "ca", label: "Canada" },
          { value: "uk", label: "United Kingdom" },
          { value: "au", label: "Australia" }
        ]
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
              { value: "fl", label: "Florida" }
            ];
          } else if (values.country === "ca") {
            return [
              { value: "on", label: "Ontario" },
              { value: "qc", label: "Quebec" },
              { value: "bc", label: "British Columbia" },
              { value: "ab", label: "Alberta" }
            ];
          } else if (values.country === "uk") {
            return [
              { value: "england", label: "England" },
              { value: "scotland", label: "Scotland" },
              { value: "wales", label: "Wales" },
              { value: "ni", label: "Northern Ireland" }
            ];
          } else if (values.country === "au") {
            return [
              { value: "nsw", label: "New South Wales" },
              { value: "vic", label: "Victoria" },
              { value: "qld", label: "Queensland" },
              { value: "wa", label: "Western Australia" }
            ];
          }
          return [];
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

  // Tabbed Form
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
          { value: "auto", label: "Auto" }
        ]
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
          { value: "de", label: "German" }
        ]
      },
      { name: "notifications", type: "switch", label: "Enable Notifications", tab: "preferences" },
      { name: "newsletter", type: "switch", label: "Subscribe to Newsletter", tab: "preferences" },
      
      // Settings tab
      { 
        name: "privacy", 
        type: "radio", 
        label: "Privacy Setting", 
        tab: "settings",
        options: [
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
          { value: "friends", label: "Friends Only" }
        ]
      },
      { name: "marketing", type: "checkbox", label: "Allow Marketing Emails", tab: "settings" },
      { name: "analytics", type: "checkbox", label: "Allow Analytics", tab: "settings" },
      { name: "location", type: "text", label: "Location (Optional)", tab: "settings" },
    ],
    tabs: [
      { id: "personal", label: "Personal Info", description: "Basic information about you" },
      { id: "preferences", label: "Preferences", description: "Your app preferences" },
      { id: "settings", label: "Settings", description: "Privacy and account settings" },
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

  // Analytics callbacks - memoized to prevent re-renders
  const onFormStart = React.useCallback((timestamp: number) => {
    console.log('📊 Form started at:', new Date(timestamp).toISOString());
  }, []);

  const onFieldFocus = React.useCallback((fieldName: string, timestamp: number) => {
    console.log(`👁️ Field "${fieldName}" focused at:`, new Date(timestamp).toISOString());
  }, []);

  const onFieldBlur = React.useCallback((fieldName: string, timeSpent: number) => {
    console.log(`⏱️ Field "${fieldName}" completed in ${timeSpent}ms`);
  }, []);

  const onPageChange = React.useCallback((fromPage: number, toPage: number, timeSpent: number) => {
    console.log(`📄 Page ${fromPage} → ${toPage} (spent ${timeSpent}ms)`);
  }, []);

  const onFormComplete = React.useCallback((timeSpent: number, formData: any) => {
    console.log(`✅ Form completed in ${timeSpent}ms with data:`, formData);
    toast.success("Analytics form completed!", { 
      description: `Total time: ${(timeSpent/1000).toFixed(1)}s - Check console for full analytics` 
    });
  }, []);

  const onFormAbandon = React.useCallback((completionPercentage: number) => {
    console.log(`❌ Form abandoned at ${completionPercentage}% completion`);
  }, []);

  // Memoize the analytics object
  const analyticsConfig = React.useMemo(() => ({
    onFormStart,
    onFieldFocus,
    onFieldBlur,
    onPageChange,
    onFormComplete,
    onFormAbandon
  }), [onFormStart, onFieldFocus, onFieldBlur, onPageChange, onFormComplete, onFormAbandon]);

  // Analytics Tracking Form
  const analyticsTrackingForm = useFormedible({
    schema: analyticsTrackingSchema,
    fields: [
      { name: "email", type: "email", label: "Business Email", page: 1 },
      { 
        name: "companySize", 
        type: "select", 
        label: "Company Size", 
        page: 1,
        options: [
          { value: "1-10", label: "1-10 employees" },
          { value: "11-50", label: "11-50 employees" },
          { value: "51-200", label: "51-200 employees" },
          { value: "200+", label: "200+ employees" }
        ]
      },
      {
        name: "interests",
        type: "multiSelect",
        label: "Areas of Interest",
        page: 2,
        options: [
          { value: "web-dev", label: "Web Development" },
          { value: "mobile", label: "Mobile Apps" },
          { value: "ecommerce", label: "E-commerce" },
          { value: "analytics", label: "Analytics" },
          { value: "automation", label: "Automation" }
        ]
      },
      { 
        name: "budget", 
        type: "radio", 
        label: "Project Budget", 
        page: 2,
        options: [
          { value: "<10k", label: "Less than $10,000" },
          { value: "10k-50k", label: "$10,000 - $50,000" },
          { value: "50k-100k", label: "$50,000 - $100,000" },
          { value: "100k+", label: "$100,000+" }
        ]
      },
      { 
        name: "timeline", 
        type: "select", 
        label: "Timeline", 
        page: 3,
        options: ["ASAP", "1-3 months", "3-6 months", "6+ months"]
      },
      { 
        name: "description", 
        type: "textarea", 
        label: "Project Description", 
        page: 3,
        textareaConfig: { rows: 4, showWordCount: true, maxLength: 500 }
      },
    ],
    pages: [
      { page: 1, title: "Company Info", description: "Tell us about your company" },
      { page: 2, title: "Project Details", description: "What are you looking for?" },
      { page: 3, title: "Timeline & Details", description: "When do you need this?" },
    ],
    progress: { showSteps: true, showPercentage: true },
    analytics: analyticsConfig,
    formOptions: {
      defaultValues: {
        email: "",
        companySize: "1-10" as const,
        interests: [],
        budget: "10k-50k" as const,
        timeline: "",
        description: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Analytics form submitted:", value);
        toast.success("Form submitted successfully!");
      },
    },
  });

  // Persistence Form
  const persistenceForm = useFormedible({
    schema: persistenceFormSchema,
    fields: [
      { 
        name: "name", 
        type: "text", 
        label: "Full Name", 
        page: 1,
        section: { title: "Contact Information", description: "Your basic details" }
      },
      { name: "email", type: "email", label: "Email Address", page: 1 },
      { name: "phone", type: "phone", label: "Phone Number", page: 1 },
      { name: "company", type: "text", label: "Company Name", page: 1 },
      { name: "jobTitle", type: "text", label: "Job Title", page: 1 },
      {
        name: "projectType",
        type: "multiSelect",
        label: "Project Type",
        page: 2,
        section: { title: "Project Requirements", description: "What do you need help with?" },
        options: [
          { value: "web-dev", label: "Web Development" },
          { value: "mobile-app", label: "Mobile App" },
          { value: "ecommerce", label: "E-commerce Platform" },
          { value: "api", label: "API Development" },
          { value: "consulting", label: "Technical Consulting" }
        ],
        multiSelectConfig: { searchable: true, maxSelections: 3 }
      },
      { 
        name: "timeline", 
        type: "select", 
        label: "Timeline", 
        page: 2,
        options: ["ASAP", "1-3 months", "3-6 months", "6+ months", "Flexible"]
      },
      { 
        name: "budget", 
        type: "radio", 
        label: "Budget Range", 
        page: 2,
        options: [
          { value: "<25k", label: "Less than $25,000" },
          { value: "25k-75k", label: "$25,000 - $75,000" },
          { value: "75k-150k", label: "$75,000 - $150,000" },
          { value: "150k+", label: "$150,000+" }
        ]
      },
      { 
        name: "description", 
        type: "textarea", 
        label: "Project Description", 
        page: 3,
        section: { title: "Project Details", description: "Tell us more about your project" },
        textareaConfig: { rows: 6, showWordCount: true, maxLength: 1000 }
      },
      { 
        name: "agreeToTerms", 
        type: "checkbox", 
        label: "I agree to the terms of service and privacy policy", 
        page: 3 
      },
    ],
    pages: [
      { page: 1, title: "Contact Information", description: "Let's start with your details" },
      { page: 2, title: "Project Requirements", description: "Tell us about your project" },
      { page: 3, title: "Final Details", description: "Complete your inquiry" },
    ],
    progress: { showSteps: true, showPercentage: true },
    persistence: {
      key: "demo-project-inquiry-form",
      storage: "localStorage",
      debounceMs: 1500,
      exclude: ["agreeToTerms"],
      restoreOnMount: true
    },
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        projectType: [],
        timeline: "",
        budget: "",
        description: "",
        agreeToTerms: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Persistence form submitted:", value);
        toast.success("Inquiry submitted!", { description: "Form data auto-saved throughout - try refreshing the page!" });
      }
    }
  });

  // Array Fields Form
  const arrayFieldsForm = useFormedible({
    schema: arrayFieldsSchema,
    fields: [
      {
        name: "teamMembers",
        type: "array",
        label: "Team Members",
        section: { title: "Team Composition", description: "Add your team members" },
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
              { name: "name", type: "text", label: "Name", placeholder: "Enter name" },
              { name: "email", type: "text", label: "Email", placeholder: "Enter email" },
              { name: "role", type: "select", label: "Role", options: [
                { value: "developer", label: "Developer" },
                { value: "designer", label: "Designer" },
                { value: "manager", label: "Manager" },
                { value: "qa", label: "QA" }
              ]},
              { name: "skills", type: "text", label: "Skills", placeholder: "Enter skills (comma-separated)" },
              { name: "startDate", type: "text", label: "Start Date", placeholder: "YYYY-MM-DD" }
            ]
          }
        },
      },
      {
        name: "contactMethods",
        type: "array",
        label: "Contact Email Addresses",
        section: { title: "Contact Information", description: "Primary and backup email addresses" },
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
        section: { title: "Emergency Information", description: "People to contact in case of emergency" },
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
              { name: "name", type: "text", label: "Name", placeholder: "Enter name" },
              { name: "relationship", type: "text", label: "Relationship", placeholder: "e.g., Spouse, Parent" },
              { name: "phone", type: "text", label: "Phone", placeholder: "Enter phone number" },
              { name: "isPrimary", type: "text", label: "Primary Contact", placeholder: "true/false" }
            ]
          }
        },
      },
    ],
    formOptions: {
      defaultValues: {
        teamMembers: [{ name: "", email: "", role: "developer", skills: [], startDate: new Date() }],
        contactMethods: [""],
        emergencyContacts: [],
      },
      onSubmit: async ({ value }) => {
        console.log("Array fields form submitted:", value);
        
        // Format the array data for display
        const formatValue = (val: any): string => {
          if (val === null || val === undefined) return 'null';
          if (typeof val === 'boolean') return val.toString();
          if (typeof val === 'number') return val.toString();
          if (typeof val === 'string') return val;
          if (Array.isArray(val)) {
            return val.map(item => 
              typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)
            ).join('\n');
          }
          if (typeof val === 'object') {
            return JSON.stringify(val, null, 2);
          }
          return String(val);
        };
        
        const formattedData = Object.entries(value)
          .map(([key, val]) => `${key}: ${formatValue(val)}`)
          .join('\n\n');
        
        toast.success("Team information saved!", {
          description: "Check console for detailed data",
          action: {
            label: "View Data",
            onClick: () => alert(`Form Data:\n\n${formattedData}`)
          }
        });
      },
    },
  });

  // Advanced Field Types Form
  const advancedFieldTypesForm = useFormedible({
    schema: advancedFieldTypesSchema,
    fields: [
      {
        name: "satisfaction",
        type: "rating",
        label: "How satisfied are you with our service?",
        section: { title: "Feedback & Ratings", description: "Rate your experience" },
        ratingConfig: {
          max: 5,
          allowHalf: true,
          icon: "star",
          size: "lg",
          showValue: true
        }
      },
      {
        name: "overallRating",
        type: "rating",
        label: "Overall Experience",
        ratingConfig: {
          max: 5,
          allowHalf: false,
          icon: "heart",
          size: "md",
          showValue: true
        }
      },
      {
        name: "phoneNumber",
        type: "phone",
        label: "Phone Number",
        section: { title: "Contact Information", description: "How can we reach you?" },
        phoneConfig: {
          defaultCountry: "US",
          format: "international"
        }
      },
      {
        name: "favoriteColor",
        type: "colorPicker",
        label: "Brand Color",
        colorConfig: {
          format: "hex",
          showPreview: true,
          presetColors: [
            "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
            "#000000", "#ffffff", "#808080", "#800000", "#008000", "#000080"
          ],
          allowCustom: true
        }
      },
      {
        name: "workLocation",
        type: "location",
        label: "Work Location",
        section: { title: "Location & Preferences", description: "Where do you work and your preferences" },
        locationConfig: {
          defaultLocation: { lat: 51.5074, lng: -0.1278 }, // London
          zoom: 12,
          enableSearch: true,
          enableGeolocation: true,
          enableManualEntry: true,
          mapProvider: "openstreetmap",
          searchPlaceholder: "Search for your work location...",
          searchOptions: {
            debounceMs: 300,
            minQueryLength: 3,
            maxResults: 5,
          },
          ui: {
            showCoordinates: true,
            showAddress: true,
            mapHeight: 400,
            coordinatesFormat: "decimal",
          },
          // Custom search using OpenStreetMap Nominatim
          searchCallback: async (query: string, options: any = {}) => {
            const params = new URLSearchParams({
              q: query,
              format: 'json',
              limit: String(options.limit || 5),
              addressdetails: '1',
            });
            
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
              const data = await response.json();
              
              return data.map((item: any, index: number) => ({
                id: item.place_id || index,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                address: item.display_name,
                city: item.address?.city || item.address?.town || item.address?.village,
                state: item.address?.state,
                country: item.address?.country,
                postalCode: item.address?.postcode,
                relevance: parseFloat(item.importance || 0),
              }));
            } catch (error) {
              console.error('Location search error:', error);
              return [];
            }
          }
        }
      },
      {
        name: "workDuration",
        type: "duration",
        label: "Daily Work Hours",
        durationConfig: {
          format: "hm",
          maxHours: 24,
          showLabels: true,
          allowNegative: false
        }
      },
      {
        name: "skills",
        type: "multiSelect",
        label: "Technical Skills",
        options: [
          { value: "javascript", label: "JavaScript" },
          { value: "typescript", label: "TypeScript" },
          { value: "react", label: "React" },
          { value: "vue", label: "Vue.js" },
          { value: "angular", label: "Angular" },
          { value: "nodejs", label: "Node.js" },
          { value: "python", label: "Python" },
          { value: "java", label: "Java" }
        ],
        multiSelectConfig: {
          searchable: true,
          creatable: true,
          maxSelections: 8,
          placeholder: "Select or type your skills..."
        }
      },
      {
        name: "experienceLevel",
        type: "slider",
        label: "Experience Level (1-10)",
        section: { title: "Professional Background", description: "Your experience and background" },
        sliderConfig: {
          min: 1,
          max: 10,
          step: 1,
          marks: [
            { value: 1, label: "Beginner" },
            { value: 5, label: "Intermediate" },
            { value: 10, label: "Expert" }
          ],
          showTooltip: true,
          showValue: true,
          orientation: "horizontal"
        }
      },
      {
        name: "energyRating",
        type: "slider",
        label: "Energy Efficiency Rating",
        section: { title: "Advanced Sliders", description: "Enhanced slider examples with custom visualizations" },
        sliderConfig: {
          min: 1,
          max: 5,
          step: 1,
          valueMapping: [
            { sliderValue: 1, displayValue: "E", label: "Poor" },
            { sliderValue: 2, displayValue: "D", label: "Fair" },
            { sliderValue: 3, displayValue: "C", label: "Good" },
            { sliderValue: 4, displayValue: "B", label: "Very Good" },
            { sliderValue: 5, displayValue: "A", label: "Excellent" }
          ],
          visualizationComponent: EnergyRatingComponent,
          showValue: true
        }
      },
      {
        name: "performanceLevel",
        type: "slider",
        label: "Performance Level",
        sliderConfig: {
          min: 0,
          max: 100,
          step: 10,
          gradientColors: {
            start: "#ef4444",
            end: "#22c55e",
            direction: "horizontal"
          },
          valueLabelSuffix: "%",
          showValue: true,
          marks: [
            { value: 0, label: "Low" },
            { value: 50, label: "Medium" },
            { value: 100, label: "High" }
          ]
        }
      },
      {
        name: "birthDate",
        type: "date",
        label: "Date of Birth",
        dateConfig: {
          format: "MM/dd/yyyy",
          maxDate: new Date(),
          minDate: new Date(1900, 0, 1),
          showTime: false
        }
      },
      {
        name: "resume",
        type: "file",
        label: "Upload Resume",
        fileConfig: {
          accept: ".pdf,.doc,.docx",
          multiple: false,
          maxSize: 5 * 1024 * 1024,
          maxFiles: 1
        }
      },
      {
        name: "aboutMe",
        type: "textarea",
        label: "About Me",
        textareaConfig: {
          rows: 6,
          resize: "vertical",
          maxLength: 1000,
          showWordCount: true
        }
      },
      {
        name: "password",
        type: "password",
        label: "Password",
        section: { title: "Security", description: "Account security settings" },
        passwordConfig: {
          showToggle: true,
          strengthMeter: true,
          minStrength: 3
        }
      },
      {
        name: "workEmail",
        type: "email",
        label: "Work Email"
      }
    ],
    formOptions: {
      defaultValues: {
        satisfaction: 5,
        phoneNumber: "",
        favoriteColor: "",
        workLocation: undefined,
        workDuration: { hours: 8, minutes: 0 },
        skills: [],
        experienceLevel: 5,
        energyRating: 3,
        performanceLevel: 50,
        birthDate: new Date(),
        resume: null,
        aboutMe: "",
        password: "",
        workEmail: "",
        overallRating: 4,
      },
      onSubmit: async ({ value }) => {
        console.log("Advanced field types form submitted:", value);
        toast.success("Profile completed!", { description: "All advanced field types captured!" });
      },
    },
  });

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/docs">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Docs
                </Link>
              </Button>
            </div>
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
          </div>

          <Tabs defaultValue="contact" className="w-full">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Basic Examples</h2>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="contact">Contact Form</TabsTrigger>
                  <TabsTrigger value="registration">Registration</TabsTrigger>
                  <TabsTrigger value="survey">Survey</TabsTrigger>
                  <TabsTrigger value="checkout">Checkout</TabsTrigger>
                  <TabsTrigger value="job">Job Application</TabsTrigger>
                  <TabsTrigger value="tabbed">Tabbed Form</TabsTrigger>
                </TabsList>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-4">Advanced Examples</h2>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="analytics">Analytics & Tracking</TabsTrigger>
                  <TabsTrigger value="persistence">Form Persistence</TabsTrigger>
                  <TabsTrigger value="arrays">Array Fields</TabsTrigger>
                  <TabsTrigger value="advanced-fields">Advanced Field Types</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="contact">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="Contact Form"
                  description="A simple contact form with validation, demonstrating basic field types and schema validation."
                  badges={[{ text: "Basic", variant: "secondary" }]}
                  preview={<contactForm.Form className="space-y-4" />}
                  code={exampleContactFormCode}
                  codeTitle="Contact Form Implementation"
                  codeDescription="Simple form setup with subject selection, message validation, and urgency flag"
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="registration">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="Multi-Step Registration"
                  description="A multi-page registration form with progress tracking and various field types."
                  badges={[{ text: "Multi-Page", variant: "secondary" }]}
                  preview={<registrationForm.Form className="space-y-4" />}
                  code={exampleRegistrationFormCode}
                  codeTitle="Multi-Step Registration Form"
                  codeDescription="Complete registration flow with personal info, contact details, and preferences across 3 pages"
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="survey">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="Dynamic Survey Form"
                  description="A survey form with conditional questions and dynamic options. Select a country to see the state/province options update automatically."
                  badges={[{ text: "Conditional", variant: "secondary" }, { text: "Dynamic Options", variant: "outline" }]}
                  preview={<surveyForm.Form className="space-y-4" />}
                  code={exampleSurveyFormCode}
                  codeTitle="Dynamic Survey with Conditional Logic"
                  codeDescription="Advanced survey featuring rating fields, conditional improvements section, and multi-select features"
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="checkout">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="E-commerce Checkout"
                  description="A complete checkout form with shipping, payment, and order options across multiple pages."
                  badges={[{ text: "Complex", variant: "secondary" }]}
                  preview={<checkoutForm.Form className="space-y-4" />}
                  code={exampleCheckoutFormCode}
                  codeTitle="E-commerce Checkout Flow"
                  codeDescription="Complete checkout process with shipping address, payment methods, and conditional card fields"
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="job">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="Job Application Form"
                  description="A comprehensive job application form with skills selection, availability, and open-ended questions."
                  badges={[{ text: "Advanced", variant: "secondary" }]}
                  preview={<jobApplicationForm.Form className="space-y-4" />}
                  code={exampleJobApplicationFormCode}
                  codeTitle="Advanced Job Application Form"
                  codeDescription="Multi-page application with searchable skills selection, salary expectations, and detailed questions"
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="tabbed">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="Tabbed Form Layout"
                  description="A form organized into tabs for better user experience with related fields grouped together."
                  badges={[{ text: "Tabs", variant: "secondary" }]}
                  preview={<tabbedForm.Form className="space-y-4" />}
                  code={`const tabbedForm = useFormedible({
  schema: tabbedFormSchema,
  fields: [
    // Personal tab
    { name: "firstName", type: "text", label: "First Name", tab: "personal" },
    { name: "lastName", type: "text", label: "Last Name", tab: "personal" },
    { name: "email", type: "email", label: "Email", tab: "personal" },
    { name: "phone", type: "phone", label: "Phone", tab: "personal" },
    
    // Preferences tab
    { name: "theme", type: "select", label: "Theme", tab: "preferences", options: [...] },
    { name: "language", type: "select", label: "Language", tab: "preferences", options: [...] },
    { name: "notifications", type: "switch", label: "Enable Notifications", tab: "preferences" },
    { name: "newsletter", type: "switch", label: "Subscribe to Newsletter", tab: "preferences" },
    
    // Settings tab
    { name: "privacy", type: "radio", label: "Privacy Setting", tab: "settings", options: [...] },
    { name: "marketing", type: "checkbox", label: "Allow Marketing Emails", tab: "settings" },
    { name: "analytics", type: "checkbox", label: "Allow Analytics", tab: "settings" },
    { name: "location", type: "text", label: "Location (Optional)", tab: "settings" },
  ],
  tabs: [
    { id: "personal", label: "Personal Info", description: "Basic information about you" },
    { id: "preferences", label: "Preferences", description: "Your app preferences" },
    { id: "settings", label: "Settings", description: "Privacy and account settings" },
  ],
  formOptions: {
    onSubmit: async ({ value }) => {
      console.log("Tabbed form submitted:", value);
      toast.success("Profile updated successfully!");
    },
  },
});`}
                  codeTitle="Tabbed Form Implementation"
                  codeDescription="Form with tabs for organizing related fields into logical groups"
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="Analytics & Tracking Form"
                  description="A form with comprehensive analytics tracking, monitoring user behavior, field interactions, and form completion patterns."
                  badges={[{ text: "Analytics", variant: "secondary" }, { text: "Tracking", variant: "outline" }]}
                  preview={<analyticsTrackingForm.Form className="space-y-4" />}
                  code={analyticsTrackingFormCode}
                  codeTitle="Analytics & Tracking Implementation"
                  codeDescription="Multi-page form with complete analytics tracking including field focus/blur, page changes, and completion analytics"
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="persistence">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="Form Persistence & Auto-Save"
                  description="A form that automatically saves progress to localStorage and restores data on page reload. Try filling it out and refreshing!"
                  badges={[{ text: "Persistence", variant: "secondary" }, { text: "Auto-Save", variant: "outline" }]}
                  preview={<persistenceForm.Form className="space-y-4" />}
                  code={persistenceFormCode}
                  codeTitle="Form Persistence Implementation"
                  codeDescription="Multi-page form with auto-save to localStorage, data restoration, and selective field exclusion"
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="arrays">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="Dynamic Array Fields"
                  description="Forms with dynamic arrays including complex nested objects, simple arrays, and sortable lists with validation."
                  badges={[{ text: "Arrays", variant: "secondary" }, { text: "Dynamic", variant: "outline" }]}
                  preview={<arrayFieldsForm.Form className="space-y-4" />}
                  code={arrayFieldsCode}
                  codeTitle="Array Fields Implementation"
                  codeDescription="Dynamic arrays with nested objects, email lists, and emergency contacts with add/remove functionality"
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="advanced-fields">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DemoCard
                  title="Advanced Field Types"
                  description="Showcase of all advanced field types including rating, phone, color picker, duration, sliders, file upload, and more."
                  badges={[{ text: "Advanced", variant: "secondary" }, { text: "Field Types", variant: "outline" }]}
                  preview={<advancedFieldTypesForm.Form className="space-y-4" />}
                  code={advancedFieldTypesCode}
                  codeTitle="Advanced Field Types Implementation"
                  codeDescription="Complete showcase of rating, phone, color picker, duration, slider, file upload, and other advanced field types"
                />
              </motion.div>
            </TabsContent>
          </Tabs>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold">Form Structure</h3>
                <p className="text-sm text-muted-foreground">
                  Break complex forms into logical sections or pages. Use clear labels and helpful descriptions.
                </p>
              </div>
              
              <div className="border-l-4 border-accent pl-4">
                <h3 className="font-semibold">Validation Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  Combine client-side validation with server-side validation. Provide immediate feedback for better UX.
                </p>
              </div>
              
              <div className="border-l-4 border-secondary pl-4">
                <h3 className="font-semibold">Progressive Enhancement</h3>
                <p className="text-sm text-muted-foreground">
                  Use conditional fields to show relevant questions only. Implement auto-save for long forms.
                </p>
              </div>
              
              <div className="border-l-4 border-muted pl-4">
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
    </>
  );
}
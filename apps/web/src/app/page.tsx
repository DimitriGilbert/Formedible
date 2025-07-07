"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Terminal,
  Package,
  Blocks,
  Zap,
  Shield,
  Users,
  Sparkles,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/code-block";

// Components
import { DemoCard } from "@/components/demo/demo-card";
import { CustomProgress } from "@/components/demo/custom-progress";

// Code examples
import {
  contactFormCode,
  profileFormCode,
  surveyFormCode,
} from "@/data/code-examples";


// Enhanced schemas with proper validation
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  newsletter: z.boolean().optional(),
});

const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  age: z
    .number()
    .min(13, "Must be at least 13 years old")
    .max(120, "Invalid age"),
  country: z.string().min(1, "Please select a country"),
  bio: z.string().optional(),
  notifications: z.boolean().default(true),
  newsletter: z.boolean().default(false),
  birthday: z.date().optional(),
});

const surveySchema = z.object({
  satisfaction: z.number().min(1).max(10),
  recommend: z.boolean(),
  feedback: z
    .string()
    .min(5, "Please provide at least 5 characters of feedback"),
  category: z.string().min(1, "Please select a category"),
});

const advancedFieldsSchema = z.object({
  favoriteColor: z.string().min(1, "Please select a color"),
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  phone: z.string().min(1, "Phone number is required"),
  experience: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Please select your experience level",
  }),
  rating: z.number().min(1, "Please provide a rating").max(5),
});

const comprehensiveSchema = z.object({
  // Basic fields
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone number is required"),

  // Advanced fields
  favoriteColor: z.string().min(1, "Please select a color"),
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  experience: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Please select your experience level",
  }),
  satisfaction: z.number().min(1, "Please provide a rating").max(5),

  // Preferences
  notifications: z.boolean(),
  newsletter: z.boolean(),
});

// Enhanced Animated Field Wrapper with deterministic intro animations
const EnhancedAnimatedWrapper: React.FC<{
  children: React.ReactNode;
  field: any;
}> = ({ children, field }) => {
  const animations = [
    { opacity: 0, y: 15 },
    { opacity: 0, x: -15 },
    { opacity: 0, scale: 0.95 },
    { opacity: 0, y: -10 },
  ];

  // Use field name hash for deterministic animation selection
  const fieldNameHash = field?.name
    ? field.name.split("").reduce((a: number, b: string) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
    : 0;

  const animationIndex = Math.abs(fieldNameHash) % animations.length;
  const selectedAnimation = animations[animationIndex];

  return (
    <motion.div
      initial={selectedAnimation}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      className="space-y-2"
    >
      {children}
    </motion.div>
  );
};





export default function Home() {
  const contactForm = useFormedible({
    schema: contactSchema,
    fields: [
      {
        name: "name",
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
      },
      {
        name: "email",
        type: "email",
        label: "Email Address",
        placeholder: "your@email.com",
      },
      {
        name: "message",
        type: "textarea",
        label: "Message",
        placeholder: "Tell us what you think...",
      },
      {
        name: "newsletter",
        type: "checkbox",
        label: "Subscribe to newsletter",
      },
    ],
    submitLabel: "Send Message",
    globalWrapper: EnhancedAnimatedWrapper,
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        message: "",
        newsletter: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Contact form submitted:", value);
        toast.success(
          "Thank you for your message! We'll get back to you soon.",
          {
            description: "Your message has been sent successfully.",
          }
        );
      },
    },
  });

  const profileForm = useFormedible({
    schema: userProfileSchema,
    fields: [
      {
        name: "firstName",
        type: "text",
        label: "First Name",
        placeholder: "John",
      },
      {
        name: "lastName",
        type: "text",
        label: "Last Name",
        placeholder: "Doe",
      },
      {
        name: "email",
        type: "email",
        label: "Email",
        placeholder: "john@example.com",
      },
      {
        name: "age",
        type: "number",
        label: "Age",
        placeholder: "25",
        min: 13,
        max: 120,
      },
      {
        name: "country",
        type: "select",
        label: "Country",
        options: [
          "United States",
          "Canada",
          "United Kingdom",
          "Germany",
          "France",
          "Other",
        ],
      },
      {
        name: "bio",
        type: "textarea",
        label: "Bio",
        placeholder: "Tell us about yourself...",
      },
      { name: "notifications", type: "switch", label: "Enable notifications" },
      {
        name: "newsletter",
        type: "checkbox",
        label: "Subscribe to newsletter",
      },
      { name: "birthday", type: "date", label: "Birthday" },
    ],
    submitLabel: "Update Profile",
    globalWrapper: EnhancedAnimatedWrapper,
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        age: 25,
        country: "",
        bio: "",
        notifications: true,
        newsletter: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Profile updated:", value);
        toast.success("Profile updated successfully!", {
          description: "Your changes have been saved.",
        });
      },
    },
  });

  const advancedFieldsForm = useFormedible({
    schema: advancedFieldsSchema,
    fields: [
      {
        name: "favoriteColor",
        type: "colorPicker",
        label: "Favorite Color",
        colorConfig: {
          format: "hex",
          showPreview: true,
          presetColors: [
            "#FF6B6B",
            "#4ECDC4",
            "#45B7D1",
            "#96CEB4",
            "#FFEAA7",
            "#DDA0DD",
            "#98D8C8",
          ],
        },
      },
      {
        name: "skills",
        type: "multiSelect",
        label: "Skills & Technologies",
        options: [
          { value: "javascript", label: "JavaScript" },
          { value: "typescript", label: "TypeScript" },
          { value: "react", label: "React" },
          { value: "vue", label: "Vue.js" },
          { value: "angular", label: "Angular" },
          { value: "node", label: "Node.js" },
          { value: "python", label: "Python" },
          { value: "java", label: "Java" },
          { value: "csharp", label: "C#" },
          { value: "go", label: "Go" },
        ],
        multiSelectConfig: {
          searchable: true,
          creatable: true,
          maxSelections: 5,
          placeholder: "Select your skills...",
        },
      },
      {
        name: "phone",
        type: "phone",
        label: "Phone Number",
        phoneConfig: {
          defaultCountry: "US",
          format: "national",
          allowedCountries: ["US", "CA", "GB", "FR", "DE", "AU"],
        },
      },
      {
        name: "experience",
        type: "radio",
        label: "Experience Level",
        options: [
          { value: "beginner", label: "Beginner (0-2 years)" },
          { value: "intermediate", label: "Intermediate (2-5 years)" },
          { value: "advanced", label: "Advanced (5+ years)" },
        ],
      },
      {
        name: "rating",
        type: "rating",
        label: "Rate Your Overall Experience",
        ratingConfig: {
          max: 5,
          icon: "star",
          size: "md",
          showValue: true,
          allowHalf: true,
        },
      },
    ],
    submitLabel: "Save Preferences",
    globalWrapper: EnhancedAnimatedWrapper,
    formOptions: {
      defaultValues: {
        favoriteColor: "#4ECDC4",
        skills: [],
        phone: "",
        experience: "beginner" as const,
        rating: 0,
      },
      onSubmit: async ({ value }) => {
        console.log("Advanced fields submitted:", value);
        toast.success("Preferences saved!", {
          description: "Your advanced preferences have been updated.",
        });
      },
    },
  });

  const comprehensiveForm = useFormedible({
    schema: comprehensiveSchema,
    fields: [
      // Page 1 - Basic Information
      {
        name: "name",
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        page: 1,
      },
      {
        name: "email",
        type: "email",
        label: "Email Address",
        placeholder: "your@email.com",
        page: 1,
      },
      {
        name: "phone",
        type: "phone",
        label: "Phone Number",
        page: 1,
        phoneConfig: {
          defaultCountry: "US",
          format: "international",
        },
      },

      // Page 2 - Preferences & Style
      {
        name: "favoriteColor",
        type: "colorPicker",
        label: "Theme Color",
        page: 2,
        colorConfig: {
          format: "hex",
          showPreview: true,
          presetColors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
        },
      },
      {
        name: "skills",
        type: "multiSelect",
        label: "Areas of Interest",
        page: 2,
        options: [
          { value: "technology", label: "Technology" },
          { value: "design", label: "Design" },
          { value: "business", label: "Business" },
          { value: "marketing", label: "Marketing" },
          { value: "education", label: "Education" },
          { value: "healthcare", label: "Healthcare" },
        ],
        multiSelectConfig: {
          searchable: true,
          maxSelections: 3,
        },
      },
      {
        name: "experience",
        type: "radio",
        label: "Experience Level",
        page: 2,
        options: [
          { value: "beginner", label: "Just getting started" },
          { value: "intermediate", label: "Some experience" },
          { value: "advanced", label: "Very experienced" },
        ],
      },

      // Page 3 - Feedback & Settings
      {
        name: "satisfaction",
        type: "rating",
        label: "How satisfied are you with our service?",
        page: 3,
        ratingConfig: {
          max: 5,
          icon: "star",
          showValue: true,
        },
      },
      {
        name: "notifications",
        type: "switch",
        label: "Enable email notifications",
        page: 3,
      },
      {
        name: "newsletter",
        type: "checkbox",
        label: "Subscribe to our newsletter",
        page: 3,
      },
    ],
    pages: [
      {
        page: 1,
        title: "Contact Information",
        description: "Let's start with your basic details",
      },
      {
        page: 2,
        title: "Preferences",
        description: "Tell us about your preferences and interests",
      },
      {
        page: 3,
        title: "Final Settings",
        description: "Complete your profile setup",
      },
    ],
    progress: {
      component: CustomProgress,
      className: "mb-6",
    },
    submitLabel: "Complete Setup",
    nextLabel: "Continue →",
    previousLabel: "← Back",
    globalWrapper: EnhancedAnimatedWrapper,
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        phone: "",
        favoriteColor: "#4ECDC4",
        skills: [],
        experience: "beginner" as const,
        satisfaction: 0,
        notifications: true,
        newsletter: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Comprehensive form completed:", value);
        toast.success("Setup completed! 🎉", {
          description: "Your profile has been set up successfully.",
        });
      },
    },
    onPageChange: (page, direction) => {
      console.log(`Navigated to page ${page} via ${direction}`);
    },
  });

  const surveyForm = useFormedible({
    schema: surveySchema,
    fields: [
      {
        name: "satisfaction",
        type: "slider",
        label: "Satisfaction (1-10)",
        min: 1,
        max: 10,
      },
      { name: "recommend", type: "switch", label: "Would you recommend us?" },
      {
        name: "feedback",
        type: "textarea",
        label: "Feedback",
        placeholder: "Your feedback helps us improve...",
      },
      {
        name: "category",
        type: "select",
        label: "Category",
        options: ["Product", "Support", "Documentation", "Other"],
      },
    ],
    submitLabel: "Submit Survey",
    globalWrapper: EnhancedAnimatedWrapper,
    formOptions: {
      defaultValues: {
        satisfaction: 5,
        recommend: true,
        feedback: "",
        category: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Survey submitted:", value);
        toast.success("Thank you for your feedback!", {
          description: "Your response helps us improve our service.",
        });
      },
    },
  });

  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const installCommand = `npx shadcn@latest add ${
    origin || "https://formedible.dev"
  }/r/use-formedible.json`;

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="secondary" className="mb-4">
                <Package className="w-3 h-3 mr-1" />
                shadcn/ui Registry Component
              </Badge>
            </motion.div>

            <motion.h2
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Schema-Driven Forms
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </motion.h2>

            <motion.p
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              A powerful React hook that wraps TanStack Form with shadcn/ui
              components. Features schema validation, multi-page support,
              component overrides, and custom wrappers.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="text-lg px-8" asChild>
                  <a href="#installation">
                    <Terminal className="w-5 h-5 mr-2" />
                    Install Now
                  </a>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8"
                  asChild
                >
                  <Link href="/builder">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Try Builder
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Installation Command */}
            <motion.div
              className="max-w-2xl mx-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="mb-2 text-center">
                <span className="text-slate-600 dark:text-slate-400 text-sm">
                  Install via shadcn CLI
                </span>
              </div>
                <CodeBlock 
                  code={installCommand} 
                  language="bash"
                  showPackageManagerTabs={true} 
                />            </motion.div>
          </motion.div>
        </section>

        {/* Component Features */}
        <motion.section
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-center mb-12">
            <motion.h3
              className="text-3xl font-bold mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Component Features
            </motion.h3>
            <motion.p
              className="text-muted-foreground text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Everything you need for building powerful forms with shadcn/ui
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: Shield,
                title: "Schema Validation",
                description:
                  "Built-in Zod schema validation with real-time error handling and type safety",
                color: "text-blue-500",
              },
              {
                icon: Zap,
                title: "Component Override",
                description:
                  "Replace any field component with your custom implementations seamlessly",
                color: "text-purple-500",
              },
              {
                icon: Sparkles,
                title: "Custom Wrappers",
                description:
                  "Add animations, special styling, or extra functionality to any field",
                color: "text-green-500",
              },
              {
                icon: Users,
                title: "Multi-Page Forms",
                description:
                  "Built-in pagination with customizable progress indicators and navigation",
                color: "text-orange-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className={`w-8 h-8 ${feature.color} mb-2`} />
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Installation Section */}
        <motion.section
          id="installation"
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Terminal className="w-6 h-6" />
                Installation & Setup
              </CardTitle>
              <CardDescription>
                Get the use-formedible hook installed in your project that uses shadcn/ui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Install the component via shadcn CLI
                </h4>
              <CodeBlock 
                code={installCommand} 
                language="bash"
                showPackageManagerTabs={true} 
              />                <p className="text-sm text-muted-foreground mt-2">
                  This installs the hook, all field components, and their
                  dependencies automatically.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Basic usage example</h4>
                <CodeBlock 
                  language="tsx"
                  title="Basic Usage Example"
                  code={`import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message too short"),
});

export function MyForm() {
  const { Form } = useFormedible({
    schema,
    fields: [
      { name: "email", type: "email", label: "Email" },
      { name: "message", type: "textarea", label: "Message" },
    ],
    formOptions: {
      defaultValues: { email: "", message: "" },
      onSubmit: async ({ value }) => console.log(value),
    },
  });

  return <Form />;
}`}
                />
              </div>

              <motion.div
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  📦 What gets installed
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>
                    • <code>hooks/use-formedible.tsx</code> - Main form hook
                  </li>
                  <li>
                    • <code>components/fields/*</code> - All field components
                    (text, select, date, etc.)
                  </li>
                  <li>• All required shadcn/ui components and dependencies</li>
                  <li>• TypeScript definitions and component interfaces</li>
                </ul>
              </motion.div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Quick Links */}
        <motion.section
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <motion.h3
              className="text-3xl font-bold mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Get Started
            </motion.h3>
            <motion.p
              className="text-muted-foreground text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Explore the interactive builder and comprehensive documentation
            </motion.p>
          </div>

          <Tabs defaultValue="contact" className="max-w-6xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="contact">Simple Form</TabsTrigger>
                <TabsTrigger value="profile">Enhanced Fields</TabsTrigger>
                <TabsTrigger value="advanced">New Field Types</TabsTrigger>
                <TabsTrigger value="survey">Custom Components</TabsTrigger>
                <TabsTrigger value="comprehensive">
                  Complete Example
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              <TabsContent key="contact" value="contact">
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Simple Contact Form"
                    description="Basic form with schema validation and standard field types"
                    preview={<contactForm.Form className="space-y-4" />}
                    code={contactFormCode}
                    codeTitle="Contact Form Implementation"
                    codeDescription="Simple form setup with Zod schema validation and basic field configuration"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent key="profile" value="profile">
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Enhanced Profile Form"
                    description="Profile form with animated wrappers and advanced field types"
                    preview={<profileForm.Form className="space-y-4" />}
                    code={profileFormCode}
                    codeTitle="Profile Form with Enhanced Features"
                    codeDescription="Form with custom animated wrappers, date picker, and various field types"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent key="advanced" value="advanced">
                <motion.div
                  key="advanced"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Advanced Field Types"
                    description="Showcase of color picker, multi-select, phone, radio, and rating fields"
                    preview={<advancedFieldsForm.Form className="space-y-4" />}
                    code={`const advancedFieldsForm = useFormedible({
  schema: z.object({
    favoriteColor: z.string().min(1, "Please select a color"),
    skills: z.array(z.string()).min(1, "Please select at least one skill"),
    phone: z.string().min(1, "Phone number is required"),
    experience: z.enum(["beginner", "intermediate", "advanced"]),
    rating: z.number().min(1).max(5),
  }),
  fields: [
    { 
      name: "favoriteColor", 
      type: "colorPicker", 
      label: "Favorite Color",
      colorConfig: {
        format: "hex",
        showPreview: true,
        presetColors: ["#FF6B6B", "#4ECDC4", "#45B7D1"]
      }
    },
    { 
      name: "skills", 
      type: "multiSelect", 
      label: "Skills & Technologies",
      options: [
        { value: "javascript", label: "JavaScript" },
        { value: "react", label: "React" },
        { value: "typescript", label: "TypeScript" }
      ],
      multiSelectConfig: {
        searchable: true,
        creatable: true,
        maxSelections: 5
      }
    },
    { 
      name: "phone", 
      type: "phone", 
      label: "Phone Number",
      phoneConfig: {
        defaultCountry: "US",
        format: "national"
      }
    },
    { 
      name: "experience", 
      type: "radio", 
      label: "Experience Level",
      options: [
        { value: "beginner", label: "Beginner (0-2 years)" },
        { value: "intermediate", label: "Intermediate (2-5 years)" },
        { value: "advanced", label: "Advanced (5+ years)" }
      ]
    },
    { 
      name: "rating", 
      type: "rating", 
      label: "Rate Your Experience",
      ratingConfig: {
        max: 5,
        icon: "star",
        showValue: true,
        allowHalf: true
      }
    }
  ]
});`}
                    codeTitle="Advanced Field Types Implementation"
                    codeDescription="Demonstration of color picker, multi-select, phone, radio, and rating field components"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent key="survey" value="survey">
                <motion.div
                  key="survey"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Survey with Custom Components"
                    description="Advanced form featuring slider, switch components, and custom validation"
                    preview={<surveyForm.Form className="space-y-4" />}
                    code={surveyFormCode}
                    codeTitle="Survey Form with Custom Components"
                    codeDescription="Advanced form showcasing slider input, switch toggle, and enhanced validation"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent key="comprehensive" value="comprehensive">
                <motion.div
                  key="comprehensive"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Comprehensive Multi-Page Form"
                    description="Complete example with all field types, multi-page navigation, and progress tracking"
                    preview={<comprehensiveForm.Form className="space-y-4" />}
                    code={`const comprehensiveForm = useFormedible({
  schema: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(1),
    favoriteColor: z.string().min(1),
    skills: z.array(z.string()).min(1),
    experience: z.enum(["beginner", "intermediate", "advanced"]),
    satisfaction: z.number().min(1).max(5),
    notifications: z.boolean(),
    newsletter: z.boolean(),
  }),
  fields: [
    // Page 1 - Contact
    { name: "name", type: "text", label: "Full Name", page: 1 },
    { name: "email", type: "email", label: "Email", page: 1 },
    { name: "phone", type: "phone", label: "Phone", page: 1 },
    
    // Page 2 - Preferences  
    { name: "favoriteColor", type: "colorPicker", label: "Theme Color", page: 2 },
    { name: "skills", type: "multiSelect", label: "Interests", page: 2 },
    { name: "experience", type: "radio", label: "Experience", page: 2 },
    
    // Page 3 - Settings
    { name: "satisfaction", type: "rating", label: "Satisfaction", page: 3 },
    { name: "notifications", type: "switch", label: "Notifications", page: 3 },
    { name: "newsletter", type: "checkbox", label: "Newsletter", page: 3 },
  ],
  pages: [
    { page: 1, title: "Contact Information" },
    { page: 2, title: "Preferences" },
    { page: 3, title: "Final Settings" },
  ]
});`}
                    codeTitle="Comprehensive Multi-Page Form"
                    codeDescription="Complete example showcasing all field types with multi-page navigation and progress tracking"
                  />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto p-4">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <Link href="/builder">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Blocks className="w-8 h-8 text-blue-500 mb-2" />
                    <CardTitle>Interactive Builder</CardTitle>
                    <CardDescription>
                      Build forms visually with our interface. Create,
                      customize, and export your forms with ease.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <Link href="/docs">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Code className="w-8 h-8 text-purple-500 mb-2" />
                    <CardTitle>Documentation</CardTitle>
                    <CardDescription>
                      Comprehensive guides, API reference, and examples to help
                      you master Formedible.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          className="border-t bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                  <Blocks className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">Formedible</span>
                <Badge variant="secondary" className="text-xs">
                  shadcn/ui Registry
                </Badge>
              </motion.div>
              <p className="text-sm text-muted-foreground">
                Built with TanStack Form, shadcn/ui, and Zod
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </>
  );
}

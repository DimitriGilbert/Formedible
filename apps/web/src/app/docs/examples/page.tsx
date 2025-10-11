"use client";

import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

// Components
import { DemoCard } from "@/components/demo/demo-card";

// Form Examples
import { ContactFormExample, contactFormCode } from "./contact-form";
import {
  RegistrationFormExample,
  registrationFormCode,
} from "./registration-form";
import { SurveyFormExample, surveyFormCode } from "./survey-form";
import { CheckoutFormExample, checkoutFormCode } from "./checkout-form";
import {
  JobApplicationFormExample,
  jobApplicationFormCode,
} from "./job-application-form";
import { TabbedFormExample, tabbedFormCode } from "./tabbed-form";
import {
  AnalyticsTrackingFormExample,
  analyticsTrackingFormCode,
} from "./analytics-tracking-form";
import {
  PersistenceFormExample,
  persistenceFormCode,
} from "./persistence-form";
import {
  ArrayFieldsFormExample,
  arrayFieldsFormCode,
} from "./array-fields-form";
import {
  ConditionalPagesFormExample,
  conditionalPagesFormCode,
} from "./conditional-pages-form";
import {
  AdvancedFieldTypesFormExample,
  advancedFieldTypesFormCode,
} from "./advanced-field-types-form";
import { RentalCarFlowForm, RentalCarFlowCode } from "./rental-car-flow-form";

// import MyForm from "./conditional-in-obj";

export default function ExamplesPage() {
  const [selectedTab, setSelectedTab] = React.useState("contact");

  // Define all examples with their categories
  const basicExamples = [
    { value: "contact", label: "Contact Form" },
    { value: "registration", label: "Registration" },
    { value: "survey", label: "Survey" },
    { value: "checkout", label: "Checkout" },
    { value: "job", label: "Job Application" },
    { value: "tabbed", label: "Tabbed Form" },
  ];

  const advancedExamples = [
    { value: "rental-flow", label: "Flow Form" },
    { value: "analytics", label: "Analytics & Tracking" },
    { value: "persistence", label: "Form Persistence" },
    { value: "arrays", label: "Array Fields" },
    { value: "conditional-pages", label: "Conditional Pages" },
    { value: "advanced-fields", label: "Advanced Field Types" },
  ];

  const allExamples = [...basicExamples, ...advancedExamples];

  return (
    <>
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
                <h1 className="text-4xl font-bold mb-4">
                  Interactive Examples
                </h1>
                <p className="text-lg text-muted-foreground">
                  Real-world examples demonstrating Formedible's capabilities
                  with working forms. Try them out to see the features in
                  action!
                </p>
              </motion.div>
            </div>

            {/* Mobile Select Navigation */}
            <div className="block sm:hidden">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Examples</h2>
                <Select value={selectedTab} onValueChange={setSelectedTab}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an example" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem disabled value="basic-header">
                      <span className="font-semibold text-muted-foreground">
                        Basic Examples
                      </span>
                    </SelectItem>
                    {basicExamples.map((example) => (
                      <SelectItem key={example.value} value={example.value}>
                        {example.label}
                      </SelectItem>
                    ))}
                    <SelectItem disabled value="advanced-header">
                      <span className="font-semibold text-muted-foreground">
                        Advanced Examples
                      </span>
                    </SelectItem>
                    {advancedExamples.map((example) => (
                      <SelectItem key={example.value} value={example.value}>
                        {example.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full"
            >
              {/* Desktop Tab Navigation */}
              <div className="hidden sm:block space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    Basic Examples
                  </h2>
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
                  <h2 className="text-2xl font-semibold mb-4">
                    Advanced Examples
                  </h2>
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="rental-flow">Flow Form</TabsTrigger>
                    <TabsTrigger value="analytics">
                      Analytics & Tracking
                    </TabsTrigger>
                    <TabsTrigger value="persistence">
                      Form Persistence
                    </TabsTrigger>
                    <TabsTrigger value="arrays">Array Fields</TabsTrigger>
                    <TabsTrigger value="conditional-pages">
                      Conditional Pages
                    </TabsTrigger>
                    <TabsTrigger value="advanced-fields">
                      Advanced Field Types
                    </TabsTrigger>
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
                    preview={<ContactFormExample />}
                    code={contactFormCode}
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
                    preview={<RegistrationFormExample />}
                    code={registrationFormCode}
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
                    badges={[
                      { text: "Conditional", variant: "secondary" },
                      { text: "Dynamic Options", variant: "outline" },
                    ]}
                    preview={<SurveyFormExample />}
                    code={surveyFormCode}
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
                    preview={<CheckoutFormExample />}
                    code={checkoutFormCode}
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
                    preview={<JobApplicationFormExample />}
                    code={jobApplicationFormCode}
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
                    preview={<TabbedFormExample />}
                    code={tabbedFormCode}
                    codeTitle="Tabbed Form Implementation"
                    codeDescription="Form with tabs for organizing related fields into logical groups"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="rental-flow">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Rental Car Flow Form"
                    description="A personalized one-field-per-page flow form for choosing a rental car. Features heavy use of dynamic text and conditional logic to create a very personal experience."
                    badges={[
                      { text: "Flow Form", variant: "secondary" },
                      { text: "Dynamic Text", variant: "outline" },
                      { text: "Personal", variant: "default" },
                    ]}
                    preview={<RentalCarFlowForm />}
                    code={RentalCarFlowCode}
                    codeTitle="Rental Car Flow Form"
                    codeDescription="Comprehensive flow form with 19 personalized pages, dynamic text throughout, and conditional navigation based on user choices"
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
                    badges={[
                      { text: "Analytics", variant: "secondary" },
                      { text: "Tracking", variant: "outline" },
                    ]}
                    preview={<AnalyticsTrackingFormExample />}
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
                    badges={[
                      { text: "Persistence", variant: "secondary" },
                      { text: "Auto-Save", variant: "outline" },
                    ]}
                    preview={<PersistenceFormExample />}
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
                    badges={[
                      { text: "Arrays", variant: "secondary" },
                      { text: "Dynamic", variant: "outline" },
                    ]}
                    preview={<ArrayFieldsFormExample />}
                    code={arrayFieldsFormCode}
                    codeTitle="Array Fields Implementation"
                    codeDescription="Dynamic arrays with nested objects, email lists, and emergency contacts with add/remove functionality"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="conditional-pages">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Conditional Pages"
                    description="Entire pages can be shown or hidden based on form values. Try changing the application type to see different pages appear. Notice how the progress bar and navigation adapt automatically!"
                    badges={[
                      { text: "Conditional", variant: "secondary" },
                      { text: "Dynamic Pages", variant: "outline" },
                      { text: "Smart Navigation", variant: "default" },
                    ]}
                    preview={<ConditionalPagesFormExample />}
                    code={conditionalPagesFormCode}
                    codeTitle="Conditional Pages Implementation"
                    codeDescription="Complete example showing how to conditionally show/hide entire pages based on form values. Both individual fields and entire pages can have conditional logic."
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
                    badges={[
                      { text: "Advanced", variant: "secondary" },
                      { text: "Field Types", variant: "outline" },
                    ]}
                    preview={<AdvancedFieldTypesFormExample />}
                    code={advancedFieldTypesFormCode}
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
                    Break complex forms into logical sections or pages. Use
                    clear labels and helpful descriptions.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-semibold">Validation Strategy</h3>
                  <p className="text-sm text-muted-foreground">
                    Combine client-side validation with server-side validation.
                    Provide immediate feedback for better UX.
                  </p>
                </div>

                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-semibold">Progressive Enhancement</h3>
                  <p className="text-sm text-muted-foreground">
                    Use conditional fields to show relevant questions only.
                    Implement auto-save for long forms.
                  </p>
                </div>

                <div className="border-l-4 border-muted pl-4">
                  <h3 className="font-semibold">Accessibility</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensure proper labeling, keyboard navigation, and screen
                    reader support for all form elements.
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

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoCard } from "@/components/demo/demo-card";
import { AnimatePresence, motion } from "motion/react";

// Import examples from docs/examples
import { ContactFormExample, contactFormCode } from "@/app/docs/examples/contact-form";
import { RegistrationFormExample, registrationFormCode } from "@/app/docs/examples/registration-form";
import { SurveyFormExample, surveyFormCode } from "@/app/docs/examples/survey-form";

export const HeroExamples: React.FC = () => {
  return (
    <Tabs defaultValue="contact" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
        <TabsTrigger value="registration" className="text-xs">Multi-Page</TabsTrigger>
        <TabsTrigger value="survey" className="text-xs">Conditional</TabsTrigger>
      </TabsList>

      <AnimatePresence mode="wait">
        <TabsContent key="contact" value="contact">
          <motion.div
            key="contact-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DemoCard
              title="Contact Form"
              description="Simple form with validation, select options, and checkbox"
              preview={<ContactFormExample />}
              code={contactFormCode}
              codeTitle="Contact Form Implementation"
              codeDescription="Clean contact form with subject selection and urgency checkbox"
            />
          </motion.div>
        </TabsContent>

        <TabsContent key="registration" value="registration">
          <motion.div
            key="registration-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DemoCard
              title="Multi-Page Registration"
              description="3-step registration form with progress tracking and page validation"
              preview={<RegistrationFormExample />}
              code={registrationFormCode}
              codeTitle="Multi-Page Form Implementation"
              codeDescription="Registration form split across multiple pages with progress indicator"
            />
          </motion.div>
        </TabsContent>

        <TabsContent key="survey" value="survey">
          <motion.div
            key="survey-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DemoCard
              title="Smart Survey Form"
              description="Dynamic form with conditional fields and smart option filtering"
              preview={<SurveyFormExample />}
              code={surveyFormCode}
              codeTitle="Conditional Logic Implementation"
              codeDescription="Survey form showcasing conditional fields and dynamic options based on user input"
            />
          </motion.div>
        </TabsContent>
      </AnimatePresence>
    </Tabs>
  );
};
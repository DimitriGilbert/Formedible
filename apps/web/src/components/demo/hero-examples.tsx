import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoCard } from "@/components/demo/demo-card";
import { AnimatePresence, motion } from "motion/react";

// Import examples from docs/examples
import {
  ContactFormExample,
  contactFormCode,
} from "@/app/docs/examples/contact-form";
import {
  RegistrationFormExample,
  registrationFormCode,
} from "@/app/docs/examples/registration-form";
import {
  SurveyFormExample,
  surveyFormCode,
} from "@/app/docs/examples/survey-form";
import {
  RentalCarFlowForm,
} from "@/app/docs/examples/rental-car-flow-form";

export const HeroExamples: React.FC = () => {
  return (
    <Tabs defaultValue="Flow" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="Flow" className="text-xs">
          Flow
        </TabsTrigger>
        <TabsTrigger value="contact" className="text-xs">
          Contact
        </TabsTrigger>
        <TabsTrigger value="registration" className="text-xs">
          Multi-Page
        </TabsTrigger>
        <TabsTrigger value="survey" className="text-xs">
          Conditional
        </TabsTrigger>
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
        <TabsContent key="Flow" value="Flow">
          <motion.div
            key="Flow-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DemoCard
              title="Rental Car Flow Form"
              description="Personalized one-field-per-page flow with conditional logic and dynamic text"
              preview={<RentalCarFlowForm />}
              code=""
              codeTitle="Rental Car Flow Form"
              codeDescription="19-page personalized flow form with heavy dynamic text usage and conditional pages"
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

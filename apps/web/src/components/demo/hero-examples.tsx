import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DemoCard } from "@/components/demo/demo-card";
import { AnimatePresence, motion } from "motion/react";

// Import examples from docs/examples and components/examples
import {
  InstallationPromptGenerator,
  installationPromptCode,
} from "@/components/examples/installation-prompt-generator";
import {
  SystemPromptGenerator,
  systemPromptCode,
} from "@/components/examples/system-prompt-generator";
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
  RentalCarFlowCode,
  RentalCarFlowForm,
} from "@/app/docs/examples/rental-car-flow-form";

export const HeroExamples: React.FC = () => {
  const [selectedExample, setSelectedExample] = React.useState("installation");

  // Define all examples with their labels
  const examples = [
    { value: "installation", label: "Install" },
    { value: "system-prompt", label: "AI Prompt" },
    { value: "Flow", label: "Flow" },
    { value: "contact", label: "Contact" },
    { value: "registration", label: "Multi-Page" },
    { value: "survey", label: "Conditional" },
  ];

  return (
    <>
      {/* Mobile Select Navigation */}
      <div className="block sm:hidden mb-4">
        <Select value={selectedExample} onValueChange={setSelectedExample}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an example" />
          </SelectTrigger>
          <SelectContent>
            {examples.map((example) => (
              <SelectItem key={example.value} value={example.value}>
                {example.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedExample} onValueChange={setSelectedExample} className="w-full">
      <AnimatePresence mode="wait">
        <TabsContent key="installation" value="installation">
          <motion.div
            key="installation-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DemoCard
              title="Installation Guide Generator"
              description="Personalized setup instructions for your project stack and preferences"
              preview={<InstallationPromptGenerator />}
              code={installationPromptCode}
              codeTitle="Installation Prompt Generator"
              codeDescription="15-page flow form that generates custom installation instructions with copy-to-clipboard"
            />
          </motion.div>
        </TabsContent>
        <TabsContent key="system-prompt" value="system-prompt">
          <motion.div
            key="system-prompt-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DemoCard
              title="AI System Prompt Generator"
              description="Create customized AI assistant prompts for Formedible development"
              preview={<SystemPromptGenerator />}
              code={systemPromptCode}
              codeTitle="System Prompt Generator"
              codeDescription="21-page configuration form using parser schema to generate specialized AI prompts"
            />
          </motion.div>
        </TabsContent>
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
              code={RentalCarFlowCode}
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

      {/* Desktop Tab Navigation */}
      <TabsList className="hidden sm:grid w-full grid-cols-6 mt-2">
        <TabsTrigger value="installation" className="text-xs">
          Install
        </TabsTrigger>
        <TabsTrigger value="system-prompt" className="text-xs">
          AI Prompt
        </TabsTrigger>
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
    </Tabs>
    </>
  );
};

import { useState } from 'react';

import { DemoCard } from '@/components/demo/demo-card';
import {
  InstallationPromptGenerator,
  installationPromptCode,
} from '@/components/examples/installation-prompt-generator';
import {
  SystemPromptGenerator,
  systemPromptCode,
} from '@/components/examples/system-prompt-generator';
import {
  ContactFormExample,
  contactFormCode,
} from '@/components/examples/contact-form';
import {
  RegistrationFormExample,
  registrationFormCode,
} from '@/components/examples/registration-form';
import {
  SurveyFormExample,
  surveyFormCode,
} from '@/components/examples/survey-form';
import {
  RentalCarFlowForm,
  RentalCarFlowCode,
} from '@/components/examples/rental-car-flow-form';

const examples = [
  { value: 'installation', label: 'Install' },
  { value: 'system-prompt', label: 'AI Prompt' },
  { value: 'flow', label: 'Flow' },
  { value: 'contact', label: 'Contact' },
  { value: 'registration', label: 'Multi-Page' },
  { value: 'survey', label: 'Conditional' },
] as const;

type ExampleValue = (typeof examples)[number]['value'];

export function HeroExamples() {
  const [selected, setSelected] = useState<ExampleValue>('installation');

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap gap-1">
        {examples.map((ex) => (
          <button
            key={ex.value}
            type="button"
            onClick={() => setSelected(ex.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${selected === ex.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {selected === 'installation' && (
        <DemoCard
          title="Installation Guide Generator"
          description="Personalized setup instructions for your project stack and preferences"
          preview={<InstallationPromptGenerator />}
          code={installationPromptCode}
          codeTitle="Installation Prompt Generator"
          codeDescription="15-page flow form that generates custom installation instructions with copy-to-clipboard"
        />
      )}
      {selected === 'system-prompt' && (
        <DemoCard
          title="AI System Prompt Generator"
          description="Create customized AI assistant prompts for Formedible development"
          preview={<SystemPromptGenerator />}
          code={systemPromptCode}
          codeTitle="System Prompt Generator"
          codeDescription="21-page configuration form using parser schema to generate specialized AI prompts"
        />
      )}
      {selected === 'flow' && (
        <DemoCard
          title="Rental Car Flow Form"
          description="Personalized one-field-per-page flow with conditional logic and dynamic text"
          preview={<RentalCarFlowForm />}
          code={RentalCarFlowCode}
          codeTitle="Rental Car Flow Form"
          codeDescription="19-page personalized flow form with heavy dynamic text usage and conditional pages"
        />
      )}
      {selected === 'contact' && (
        <DemoCard
          title="Contact Form"
          description="Simple form with validation, select options, and checkbox"
          preview={<ContactFormExample />}
          code={contactFormCode}
          codeTitle="Contact Form Implementation"
          codeDescription="Clean contact form with subject selection and urgency checkbox"
        />
      )}
      {selected === 'registration' && (
        <DemoCard
          title="Multi-Page Registration"
          description="3-step registration form with progress tracking and page validation"
          preview={<RegistrationFormExample />}
          code={registrationFormCode}
          codeTitle="Multi-Page Form Implementation"
          codeDescription="Registration form split across multiple pages with progress indicator"
        />
      )}
      {selected === 'survey' && (
        <DemoCard
          title="Smart Survey Form"
          description="Dynamic form with conditional fields and smart option filtering"
          preview={<SurveyFormExample />}
          code={surveyFormCode}
          codeTitle="Conditional Logic Implementation"
          codeDescription="Survey form showcasing conditional fields and dynamic options based on user input"
        />
      )}
    </div>
  );
}

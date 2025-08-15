"use client";

import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Database,
  Save,
  Settings,
  Shield,
  Clock,
  HardDrive,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DocCard } from "@/components/doc-card";
import Link from "next/link";
import { useTheme } from "next-themes";

// export const metadata: Metadata = {
//   title: "Form Persistence - Formedible",
//   description:
//     "Learn how to implement auto-save and form state persistence in Formedible using localStorage and sessionStorage.",
// };

export default function PersistencePage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const darkMode = currentTheme === 'dark';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
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

            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4">
                <Database className="w-3 h-3 mr-1" />
                Form Persistence
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Auto-Save & Data Recovery
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Automatically save form data to browser storage and restore it
                when users return. Perfect for long forms, multi-step wizards,
                and improving user experience.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Save className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Auto-save</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">localStorage</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <RefreshCcw className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Restoration</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <DocCard
              title="Basic Setup"
              description="Enable form persistence with a simple configuration to automatically save user data."
              icon={Save}
            >
              <p className="text-muted-foreground">
                Enable form persistence by adding a <code>persistence</code>{" "}
                configuration to your form. The form data will be automatically
                saved as users type and restored when they return.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">Basic Example</h3>
                <CodeBlock
                  code={`const { Form } = useFormedible({
  fields: [
    { name: 'firstName', type: 'text', label: 'First Name' },
    { name: 'lastName', type: 'text', label: 'Last Name' },
    { name: 'email', type: 'email', label: 'Email' },
  ],
  persistence: {
    key: 'user-registration-form',
    storage: 'localStorage',
    restoreOnMount: true
  }
});`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>
            </DocCard>

            <DocCard
              title="Configuration Options"
              description="Customize persistence behavior with storage type, debouncing, and field exclusion."
              icon={Settings}
            >
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Complete Configuration
                </h3>
                <CodeBlock
                  code={`persistence: {
  key: 'my-form-data',              // Unique storage key
  storage: 'localStorage',          // 'localStorage' or 'sessionStorage'
  debounceMs: 1000,                // Debounce save operations (default: 1000ms)
  exclude: ['password', 'ssn'],     // Fields to exclude from persistence
  restoreOnMount: true              // Restore data when component mounts
}`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/2 to-muted-foreground/2">
                  <h4 className="font-semibold mb-2">localStorage</h4>
                  <p className="text-sm text-muted-foreground">
                    Data persists across browser sessions until manually
                    cleared. Best for forms users might return to later.
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-br from-accent/2 to-secondary/2">
                  <h4 className="font-semibold mb-2">sessionStorage</h4>
                  <p className="text-sm text-muted-foreground">
                    Data persists only for the current browser session. Best for
                    temporary data or sensitive forms.
                  </p>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Excluding Sensitive Fields"
              description="Prevent sensitive information from being saved to browser storage for security."
              icon={Shield}
            >
              <p className="text-muted-foreground mb-6">
                Use the <code>exclude</code> option to prevent sensitive fields
                from being saved to storage:
              </p>

              <CodeBlock
                code={`const { Form } = useFormedible({
  fields: [
    { name: 'username', type: 'text', label: 'Username' },
    { name: 'password', type: 'password', label: 'Password' },
    { name: 'creditCard', type: 'text', label: 'Credit Card' },
    { name: 'email', type: 'email', label: 'Email' },
  ],
  persistence: {
    key: 'registration-form',
    storage: 'localStorage',
    exclude: ['password', 'creditCard'], // These won't be saved
    restoreOnMount: true
  }
});`}
                language="tsx"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Manual Storage Control"
              description="Access storage functions directly for manual control over save, load, and clear operations."
              icon={Database}
            >
              <p className="text-muted-foreground mb-6">
                Access storage functions directly for manual control over when
                data is saved or cleared:
              </p>

              <CodeBlock
                code={`const { 
  Form, 
  saveToStorage, 
  loadFromStorage, 
  clearStorage 
} = useFormedible({
  // ... configuration
});

// Manual operations
const handleSave = () => {
  const currentData = form.state.values;
  saveToStorage(currentData);
};

const handleLoad = () => {
  const savedData = loadFromStorage();
  if (savedData) {
    // Handle loaded data
    console.log('Loaded data:', savedData);
  }
};

const handleClear = () => {
  clearStorage();
};`}
                language="tsx"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Multi-Page Forms"
              description="Persistence automatically works with multi-step forms, saving both data and current page."
              icon={RefreshCcw}
            >
              <p className="text-muted-foreground mb-6">
                Persistence automatically works with multi-page forms, saving
                both form data and current page:
              </p>

              <CodeBlock
                code={`const { Form } = useFormedible({
  fields: [
    { name: 'firstName', type: 'text', label: 'First Name', page: 1 },
    { name: 'lastName', type: 'text', label: 'Last Name', page: 1 },
    { name: 'email', type: 'email', label: 'Email', page: 2 },
    { name: 'phone', type: 'tel', label: 'Phone', page: 2 },
  ],
  persistence: {
    key: 'multi-step-form',
    storage: 'localStorage',
    restoreOnMount: true
  }
});

// When user returns, they'll be on the same page with their data restored`}
                language="tsx"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Automatic Cleanup"
              description="Form data is automatically cleared from storage after successful form submission."
              icon={Save}
            >
              <p className="text-muted-foreground mb-6">
                Form data is automatically cleared from storage when the form is
                successfully submitted:
              </p>

              <CodeBlock
                code={`const { Form } = useFormedible({
  fields: [
    // ... your fields
  ],
  persistence: {
    key: 'contact-form',
    storage: 'localStorage',
    restoreOnMount: true
  },
  formOptions: {
    onSubmit: async ({ value }) => {
      // Submit form data
      await submitToAPI(value);
      
      // Storage is automatically cleared after successful submission
      // No manual cleanup needed!
    }
  }
});`}
                language="tsx"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Error Handling"
              description="Graceful error handling ensures forms work even when storage operations fail."
              icon={Settings}
            >
              <p className="text-muted-foreground mb-6">
                Persistence operations are wrapped in try-catch blocks and will
                log warnings if storage fails:
              </p>

              <CodeBlock
                code={`// Storage operations handle errors gracefully
// If localStorage is full or disabled, the form continues to work normally
// Check browser console for persistence warnings

// You can also handle storage errors in your application:
const { Form, saveToStorage } = useFormedible({
  // ... configuration
});

const handleManualSave = () => {
  try {
    saveToStorage(form.state.values);
    console.log('Data saved successfully');
  } catch (error) {
    console.warn('Failed to save form data:', error);
    // Handle error (show user notification, etc.)
  }
};`}
                language="tsx"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Best Practices"
              description="Guidelines for effective persistence implementation and optimal user experience."
              icon={Clock}
            >
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Unique Keys</h3>
                  <p className="text-sm text-muted-foreground">
                    Use descriptive, unique keys for each form to avoid
                    conflicts between different forms.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-semibold">Sensitive Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Always exclude passwords, credit cards, and other sensitive
                    information from persistence.
                  </p>
                </div>

                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-semibold">Storage Choice</h3>
                  <p className="text-sm text-muted-foreground">
                    Use localStorage for forms users might return to later,
                    sessionStorage for temporary data.
                  </p>
                </div>

                <div className="border-l-4 border-muted pl-4">
                  <h3 className="font-semibold">Debouncing</h3>
                  <p className="text-sm text-muted-foreground">
                    Adjust debounce timing based on form complexity - longer for
                    complex forms to reduce storage writes.
                  </p>
                </div>
              </div>
            </DocCard>
          </div>

          {/* Ready to Build */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Implement Form Persistence?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Start building forms with automatic data persistence and
                recovery. Create resilient user experiences that never lose user
                progress.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/docs/getting-started">Get Started</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/docs/examples">View Examples</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Shield, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DocCard } from "@/components/doc-card";
import Link from "next/link";
import { useTheme } from "next-themes";

// export const metadata: Metadata = {
//   title: "Advanced Validation - Formedible",
//   description:
//     "Learn about cross-field validation, async validation, and advanced validation patterns in Formedible.",
// };

export default function ValidationPage() {
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
                <CheckCircle className="w-3 h-3 mr-1" />
                Advanced Validation
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Powerful Validation Patterns
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Formedible provides advanced validation capabilities including
                cross-field validation, async validation with loading states,
                and seamless integration with Zod schemas.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Cross-Field</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Async Validation</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Debouncing</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <DocCard
              title="Cross-Field Validation"
              description="Validate fields based on the values of other fields for complex validation scenarios."
              icon={Shield}
            >
              <p className="text-muted-foreground">
                Cross-field validation allows you to validate fields based on
                the values of other fields. This is useful for scenarios like
                password confirmation, date range validation, or conditional
                requirements.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Password Confirmation Example
                </h3>
                <CodeBlock
                  code={`const { Form } = useFormedible({
  fields: [
    { name: 'password', type: 'password', label: 'Password' },
    { name: 'confirmPassword', type: 'password', label: 'Confirm Password' },
  ],
  crossFieldValidation: [
    {
      fields: ['password', 'confirmPassword'],
      validator: (values) => {
        if (values.password !== values.confirmPassword) {
          return 'Passwords must match';
        }
        return null;
      },
      message: 'Passwords must match'
    }
  ]
});`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Date Range Validation Example
                </h3>
                <CodeBlock
                  code={`crossFieldValidation: [
  {
    fields: ['startDate', 'endDate'],
    validator: (values) => {
      if (values.startDate && values.endDate) {
        const start = new Date(values.startDate);
        const end = new Date(values.endDate);
        if (start >= end) {
          return 'End date must be after start date';
        }
      }
      return null;
    },
    message: 'Invalid date range'
  }
]`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>
            </DocCard>

            <DocCard
              title="Async Validation"
              description="Server-side validation with debouncing and loading states for better UX."
              icon={Clock}
            >
              <p className="text-muted-foreground">
                Async validation enables server-side validation, such as
                checking username availability or validating email addresses. It
                includes debouncing and loading states for better UX.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Username Availability Example
                </h3>
                <CodeBlock
                  code={`const { Form } = useFormedible({
  fields: [
    { name: 'username', type: 'text', label: 'Username' },
  ],
  asyncValidation: {
    username: {
      validator: async (value) => {
        if (!value) return null;
        
        // Simulate API call
        const response = await fetch(\`/api/check-username?username=\${value}\`);
        const data = await response.json();
        
        return data.available ? null : 'Username is already taken';
      },
      debounceMs: 500,
      loadingMessage: 'Checking availability...'
    }
  }
});`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Email Validation Example
                </h3>
                <CodeBlock
                  code={`asyncValidation: {
  email: {
    validator: async (value) => {
      if (!value) return null;
      
      try {
        const response = await fetch('/api/validate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value })
        });
        
        const result = await response.json();
        return result.valid ? null : result.message;
      } catch (error) {
        return 'Unable to validate email';
      }
    },
    debounceMs: 300,
    loadingMessage: 'Validating email...'
  }
}`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>
            </DocCard>

            <DocCard
              title="Validation States"
              description="Access validation states and errors through the hook's return values."
              icon={Zap}
            >
              <CodeBlock
                code={`const { 
  Form, 
  crossFieldErrors, 
  asyncValidationStates 
} = useFormedible({
  // ... configuration
});

// Cross-field errors
console.log(crossFieldErrors); // { password: 'Passwords must match' }

// Async validation states
console.log(asyncValidationStates); 
// { 
//   username: { 
//     loading: false, 
//     error: 'Username is already taken' 
//   } 
// }`}
                language="tsx"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Best Practices"
              description="Guidelines for effective validation implementation and user experience."
              icon={Shield}
            >
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Debouncing</h3>
                  <p className="text-sm text-muted-foreground">
                    Use appropriate debounce times for async validation
                    (300-500ms) to avoid excessive API calls.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-semibold">Error Messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Provide clear, actionable error messages that help users
                    understand how to fix validation issues.
                  </p>
                </div>

                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-semibold">Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Cross-field validation runs on every form change, so keep
                    validators lightweight and efficient.
                  </p>
                </div>

                <div className="border-l-4 border-muted pl-4">
                  <h3 className="font-semibold">Error Handling</h3>
                  <p className="text-sm text-muted-foreground">
                    Always handle async validation errors gracefully and provide
                    fallback messages.
                  </p>
                </div>
              </div>
            </DocCard>
          </div>

          {/* Ready to Build */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Implement Advanced Validation?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Start building forms with powerful validation patterns. Create
                robust, user-friendly validation that enhances the form
                experience.
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

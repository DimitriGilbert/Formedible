import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TestTube, Play, CheckCircle, Clock, Settings, Shield, Users, FileStack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Testing Forms - Formedible",
  description: "Learn how to test Formedible forms with the built-in testing utilities and best practices.",
};

export default function TestingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                <TestTube className="w-3 h-3 mr-1" />
                Testing Forms
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Comprehensive Testing Utilities
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Formedible provides comprehensive testing utilities to help you write reliable tests 
                for your forms, including support for validation, async operations, and multi-page forms.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <TestTube className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Test Utilities</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Play className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Jest/Vitest</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Assertions</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Getting Started</CardTitle>
                    <CardDescription className="text-base">
                      Import the testing utilities and create a form tester for your form configuration.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">
                  Import the testing utilities from Formedible and create a form tester for your form configuration.
                  The form tester provides a comprehensive API for interacting with and testing your forms.
                </p>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Basic Setup</h3>
                  <CodeBlock
                    code={`import { createFormTester } from 'formedible';

const formConfig = {
  fields: [
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'password', type: 'password', label: 'Password' },
  ],
};

test('form validation', async () => {
  const tester = createFormTester(formConfig);
  const actions = await tester.render();

  // Fill invalid email
  await actions.fillField('email', 'invalid-email');
  actions.expectError('email');

  // Fill valid email
  await actions.fillField('email', 'test@example.com');
  actions.expectNoError('email');

  // Submit form
  await actions.submitForm();
});`}
                    language="tsx"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Available Actions</CardTitle>
                    <CardDescription className="text-base">
                      Comprehensive set of actions for interacting with your forms during tests.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">
                  The form tester provides a comprehensive set of actions for interacting with your forms,
                  including field manipulation, form submission, and multi-page navigation.
                </p>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Field Interactions</h3>
                  <CodeBlock
                    code={`// Fill individual fields
await actions.fillField('email', 'user@example.com');
await actions.fillField('age', 25);

// Fill multiple fields at once
await actions.fillFields({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});

// Trigger focus and blur events
await actions.triggerFieldFocus('email');
await actions.triggerFieldBlur('email');`}
                    language="tsx"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Form Actions</h3>
                  <CodeBlock
                    code={`// Submit the form
await actions.submitForm();

// Reset the form
await actions.resetForm();

// Get current form data
const formData = actions.getFormData();
console.log(formData); // { email: 'user@example.com', age: 25 }`}
                    language="tsx"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Multi-Page Navigation</h3>
                  <CodeBlock
                    code={`// Navigate to specific page
await actions.goToPage(2);

// Navigate using buttons
await actions.nextPage();
await actions.previousPage();

// Check current page
actions.expectCurrentPage(1);`}
                    language="tsx"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Validation Testing</CardTitle>
                    <CardDescription className="text-base">
                      Test form validation with built-in assertion methods and expect utilities.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">
                  Test form validation with built-in assertion methods that provide clear expectations
                  for both field-level and form-level validation scenarios.
                </p>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Validation Assertions</h3>
                  <CodeBlock
                    code={`test('form validation', async () => {
  const tester = createFormTester({
    fields: [
      { name: 'email', type: 'email', label: 'Email' },
      { name: 'age', type: 'number', label: 'Age' },
    ],
  });
  
  const actions = await tester.render();

  // Test field-level validation
  await actions.fillField('email', 'invalid');
  actions.expectError('email', 'Invalid email');
  
  await actions.fillField('email', 'valid@example.com');
  actions.expectNoError('email');

  // Test form-level validation
  await actions.fillField('age', -5);
  actions.expectInvalid();
  
  await actions.fillField('age', 25);
  actions.expectValid();

  // Test field values
  actions.expectFieldValue('email', 'valid@example.com');
  actions.expectFieldValue('age', '25');
});`}
                    language="tsx"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Cross-Field Validation Testing</CardTitle>
                    <CardDescription className="text-base">
                      Test cross-field validation scenarios like password confirmation and date ranges.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">
                  Test cross-field validation scenarios where one field's validity depends on another field's value,
                  such as password confirmation or date range validation.
                </p>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Password Confirmation Example</h3>
                  <CodeBlock
                    code={`test('password confirmation validation', async () => {
  const tester = createFormTester({
    fields: [
      { name: 'password', type: 'password', label: 'Password' },
      { name: 'confirmPassword', type: 'password', label: 'Confirm Password' },
    ],
    crossFieldValidation: [{
      fields: ['password', 'confirmPassword'],
      validator: (values) => 
        values.password !== values.confirmPassword ? 'Passwords must match' : null,
      message: 'Passwords must match'
    }]
  });

  const actions = await tester.render();

  // Test mismatched passwords
  await actions.fillField('password', 'password123');
  await actions.fillField('confirmPassword', 'different');
  
  actions.expectError('password', 'Passwords must match');
  actions.expectError('confirmPassword', 'Passwords must match');

  // Test matching passwords
  await actions.fillField('confirmPassword', 'password123');
  
  actions.expectNoError('password');
  actions.expectNoError('confirmPassword');
});`}
                    language="tsx"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Async Validation Testing</CardTitle>
                    <CardDescription className="text-base">
                      Test async validation with proper waiting for completion and loading states.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">
                  Test async validation scenarios like server-side username availability checks
                  with proper waiting for completion and loading state management.
                </p>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Username Availability Example</h3>
                  <CodeBlock
                    code={`test('async username validation', async () => {
  const tester = createFormTester({
    fields: [
      { name: 'username', type: 'text', label: 'Username' },
    ],
    asyncValidation: {
      username: {
        validator: async (value) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 100));
          return value === 'taken' ? 'Username is taken' : null;
        },
        debounceMs: 300
      }
    }
  });

  const actions = await tester.render();

  // Test taken username
  await actions.fillField('username', 'taken');
  await actions.waitForAsyncValidation('username');
  
  actions.expectError('username', 'Username is taken');

  // Test available username
  await actions.fillField('username', 'available');
  await actions.waitForAsyncValidation('username');
  
  actions.expectNoError('username');
});`}
                    language="tsx"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <FileStack className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Multi-Page Form Testing</CardTitle>
                    <CardDescription className="text-base">
                      Test multi-page forms with navigation, data persistence, and page-specific validation.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">
                  Test multi-page forms with navigation controls, ensuring data persists across pages
                  and page-specific validation works correctly throughout the user journey.
                </p>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Multi-Page Navigation Example</h3>
                  <CodeBlock
                    code={`test('multi-page form navigation', async () => {
  const tester = createFormTester({
    fields: [
      { name: 'firstName', type: 'text', label: 'First Name', page: 1 },
      { name: 'lastName', type: 'text', label: 'Last Name', page: 1 },
      { name: 'email', type: 'email', label: 'Email', page: 2 },
      { name: 'phone', type: 'tel', label: 'Phone', page: 2 },
    ],
  });

  const actions = await tester.render();

  // Start on page 1
  actions.expectCurrentPage(1);
  
  // Fill page 1 fields
  await actions.fillField('firstName', 'John');
  await actions.fillField('lastName', 'Doe');
  
  // Navigate to page 2
  await actions.nextPage();
  actions.expectCurrentPage(2);
  
  // Fill page 2 fields
  await actions.fillField('email', 'john@example.com');
  await actions.fillField('phone', '555-1234');
  
  // Go back to page 1
  await actions.previousPage();
  actions.expectCurrentPage(1);
  
  // Verify data is preserved
  actions.expectFieldValue('firstName', 'John');
  actions.expectFieldValue('lastName', 'Doe');
  
  // Go to page 2 and submit
  await actions.nextPage();
  await actions.submitForm();
});`}
                    language="tsx"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Jest/Vitest Matchers</CardTitle>
                    <CardDescription className="text-base">
                      Use custom matchers for more readable and expressive test assertions.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">
                  Formedible provides custom Jest/Vitest matchers that make your test assertions
                  more readable and expressive, improving test maintainability.
                </p>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Setup Custom Matchers</h3>
                  <CodeBlock
                    code={`// In your test setup file
import { formMatchers } from 'formedible';

expect.extend(formMatchers);

// Now you can use custom matchers
test('form validation with matchers', async () => {
  const tester = createFormTester(config);
  
  await tester.fillField('email', 'invalid');
  expect(tester).toHaveError('email');
  
  await tester.fillField('email', 'valid@example.com');
  expect(tester).toHaveNoError('email');
  
  expect(tester).toBeValid();
});`}
                    language="tsx"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <TestTube className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Testing with React Testing Library</CardTitle>
                    <CardDescription className="text-base">
                      Integrate Formedible testing utilities with React Testing Library for complete testing.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">
                  Combine Formedible's form testing utilities with React Testing Library
                  for comprehensive component and integration testing.
                </p>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Component Integration Example</h3>
                  <CodeBlock
                    code={`import { render, screen } from '@testing-library/react';
import { createFormTester } from 'formedible';
import MyFormComponent from './MyFormComponent';

test('form component integration', async () => {
  const { container } = render(<MyFormComponent />);
  
  const tester = createFormTester(formConfig, container);
  const actions = await tester.render();
  
  // Set form instance from your component
  const formInstance = getFormInstanceFromComponent(); // Your implementation
  tester.setFormInstance(formInstance);
  
  // Now test as usual
  await actions.fillField('email', 'test@example.com');
  await actions.submitForm();
  
  // Use RTL assertions alongside Formedible
  expect(screen.getByText('Form submitted successfully')).toBeInTheDocument();
});`}
                    language="tsx"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Best Practices</CardTitle>
                    <CardDescription className="text-base">
                      Guidelines for effective form testing and maintainable test suites.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold">Test User Flows</h3>
                    <p className="text-sm text-muted-foreground">
                      Test complete user journeys, not just individual field validation.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-accent pl-4">
                    <h3 className="font-semibold">Async Operations</h3>
                    <p className="text-sm text-muted-foreground">
                      Always wait for async validation to complete before making assertions.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-secondary pl-4">
                    <h3 className="font-semibold">Error Scenarios</h3>
                    <p className="text-sm text-muted-foreground">
                      Test both success and error scenarios to ensure robust error handling.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-muted pl-4">
                    <h3 className="font-semibold">Isolation</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep tests isolated and independent to avoid test interference.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Complete Test Suite Example</CardTitle>
                    <CardDescription className="text-base">
                      A comprehensive example of testing a registration form with all features.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">
                  Here's a complete example of testing a registration form that demonstrates
                  all the testing capabilities including async validation, cross-field validation, and error scenarios.
                </p>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Registration Form Test Suite</h3>
                  <CodeBlock
                    code={`describe('Registration Form', () => {
  const formConfig = {
    fields: [
      { name: 'username', type: 'text', label: 'Username' },
      { name: 'email', type: 'email', label: 'Email' },
      { name: 'password', type: 'password', label: 'Password' },
      { name: 'confirmPassword', type: 'password', label: 'Confirm Password' },
    ],
    crossFieldValidation: [{
      fields: ['password', 'confirmPassword'],
      validator: (values) => 
        values.password !== values.confirmPassword ? 'Passwords must match' : null,
      message: 'Passwords must match'
    }],
    asyncValidation: {
      username: {
        validator: async (value) => {
          const taken = ['admin', 'user', 'test'];
          return taken.includes(value) ? 'Username is taken' : null;
        }
      }
    }
  };

  test('successful registration', async () => {
    const tester = createFormTester(formConfig);
    const actions = await tester.render();

    await actions.fillFields({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    await actions.waitForAsyncValidation('username');
    
    actions.expectValid();
    await actions.submitForm();
  });

  test('validation errors', async () => {
    const tester = createFormTester(formConfig);
    const actions = await tester.render();

    // Test taken username
    await actions.fillField('username', 'admin');
    await actions.waitForAsyncValidation('username');
    actions.expectError('username', 'Username is taken');

    // Test password mismatch
    await actions.fillField('password', 'password123');
    await actions.fillField('confirmPassword', 'different');
    actions.expectError('password', 'Passwords must match');

    // Test invalid email
    await actions.fillField('email', 'invalid-email');
    actions.expectError('email');

    actions.expectInvalid();
  });
});`}
                    language="tsx"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ready to Build */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Build Rock-Solid Forms?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Start testing your forms with confidence using Formedible's comprehensive testing utilities. 
                Build reliable, well-tested forms that your users and team can depend on.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/docs/getting-started">
                    Get Started
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/docs/examples">
                    View Examples
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
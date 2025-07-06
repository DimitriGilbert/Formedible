import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testing Forms - Formedible",
  description: "Learn how to test Formedible forms with the built-in testing utilities and best practices.",
};

export default function TestingPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Testing Forms</h1>
          <p className="text-lg text-muted-foreground">
            Formedible provides comprehensive testing utilities to help you write reliable tests 
            for your forms, including support for validation, async operations, and multi-page forms.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="mb-4">
              Import the testing utilities from Formedible and create a form tester for your form configuration:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Basic Setup</h3>
              <pre className="text-sm overflow-x-auto">
{`import { createFormTester } from 'formedible';

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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Available Actions</h2>
            <p className="mb-4">
              The form tester provides a comprehensive set of actions for interacting with your forms:
            </p>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Field Interactions</h3>
                <pre className="text-sm overflow-x-auto">
{`// Fill individual fields
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
                </pre>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Form Actions</h3>
                <pre className="text-sm overflow-x-auto">
{`// Submit the form
await actions.submitForm();

// Reset the form
await actions.resetForm();

// Get current form data
const formData = actions.getFormData();
console.log(formData); // { email: 'user@example.com', age: 25 }`}
                </pre>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Multi-Page Navigation</h3>
                <pre className="text-sm overflow-x-auto">
{`// Navigate to specific page
await actions.goToPage(2);

// Navigate using buttons
await actions.nextPage();
await actions.previousPage();

// Check current page
actions.expectCurrentPage(1);`}
                </pre>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Validation Testing</h2>
            <p className="mb-4">
              Test form validation with built-in assertion methods:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Validation Assertions</h3>
              <pre className="text-sm overflow-x-auto">
{`test('form validation', async () => {
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cross-Field Validation Testing</h2>
            <p className="mb-4">
              Test cross-field validation scenarios like password confirmation:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`test('password confirmation validation', async () => {
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Async Validation Testing</h2>
            <p className="mb-4">
              Test async validation with proper waiting for completion:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`test('async username validation', async () => {
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Multi-Page Form Testing</h2>
            <p className="mb-4">
              Test multi-page forms with navigation and page-specific validation:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`test('multi-page form navigation', async () => {
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Jest/Vitest Matchers</h2>
            <p className="mb-4">
              Use custom matchers for more readable test assertions:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Setup Matchers</h3>
              <pre className="text-sm overflow-x-auto">
{`// In your test setup file
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Testing with React Testing Library</h2>
            <p className="mb-4">
              Integrate Formedible testing utilities with React Testing Library:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`import { render, screen } from '@testing-library/react';
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">Test User Flows</h3>
                <p className="text-sm text-muted-foreground">
                  Test complete user journeys, not just individual field validation.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold">Async Operations</h3>
                <p className="text-sm text-muted-foreground">
                  Always wait for async validation to complete before making assertions.
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold">Error Scenarios</h3>
                <p className="text-sm text-muted-foreground">
                  Test both success and error scenarios to ensure robust error handling.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold">Isolation</h3>
                <p className="text-sm text-muted-foreground">
                  Keep tests isolated and independent to avoid test interference.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Example Test Suite</h2>
            <p className="mb-4">
              Here's a complete example of testing a registration form:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`describe('Registration Form', () => {
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
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
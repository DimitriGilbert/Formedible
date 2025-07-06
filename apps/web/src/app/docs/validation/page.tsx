import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advanced Validation - Formedible",
  description: "Learn about cross-field validation, async validation, and advanced validation patterns in Formedible.",
};

export default function ValidationPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Advanced Validation</h1>
          <p className="text-lg text-muted-foreground">
            Formedible provides powerful validation capabilities including cross-field validation, 
            async validation with loading states, and seamless integration with Zod schemas.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Cross-Field Validation</h2>
            <p className="mb-4">
              Cross-field validation allows you to validate fields based on the values of other fields. 
              This is useful for scenarios like password confirmation, date range validation, or conditional requirements.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Example: Password Confirmation</h3>
              <pre className="text-sm overflow-x-auto">
{`const { Form } = useFormedible({
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
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Example: Date Range Validation</h3>
              <pre className="text-sm overflow-x-auto">
{`crossFieldValidation: [
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Async Validation</h2>
            <p className="mb-4">
              Async validation enables server-side validation, such as checking username availability 
              or validating email addresses. It includes debouncing and loading states for better UX.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Example: Username Availability</h3>
              <pre className="text-sm overflow-x-auto">
{`const { Form } = useFormedible({
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
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Example: Email Validation</h3>
              <pre className="text-sm overflow-x-auto">
{`asyncValidation: {
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Validation States</h2>
            <p className="mb-4">
              Access validation states and errors through the hook's return values:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`const { 
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">Debouncing</h3>
                <p className="text-sm text-muted-foreground">
                  Use appropriate debounce times for async validation (300-500ms) to avoid excessive API calls.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold">Error Messages</h3>
                <p className="text-sm text-muted-foreground">
                  Provide clear, actionable error messages that help users understand how to fix validation issues.
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold">Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Cross-field validation runs on every form change, so keep validators lightweight and efficient.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold">Error Handling</h3>
                <p className="text-sm text-muted-foreground">
                  Always handle async validation errors gracefully and provide fallback messages.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
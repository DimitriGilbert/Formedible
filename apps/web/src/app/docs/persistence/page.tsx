import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Persistence - Formedible",
  description: "Learn how to implement auto-save and form state persistence in Formedible using localStorage and sessionStorage.",
};

export default function PersistencePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Form Persistence</h1>
          <p className="text-lg text-muted-foreground">
            Automatically save form data to browser storage and restore it when users return. 
            Perfect for long forms, multi-step wizards, and improving user experience.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Basic Setup</h2>
            <p className="mb-4">
              Enable form persistence by adding a <code>persistence</code> configuration to your form. 
              The form data will be automatically saved as users type and restored when they return.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Basic Example</h3>
              <pre className="text-sm overflow-x-auto">
{`const { Form } = useFormedible({
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Configuration Options</h2>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Complete Configuration</h3>
                <pre className="text-sm overflow-x-auto">
{`persistence: {
  key: 'my-form-data',              // Unique storage key
  storage: 'localStorage',          // 'localStorage' or 'sessionStorage'
  debounceMs: 1000,                // Debounce save operations (default: 1000ms)
  exclude: ['password', 'ssn'],     // Fields to exclude from persistence
  restoreOnMount: true              // Restore data when component mounts
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">localStorage</h4>
                  <p className="text-sm text-muted-foreground">
                    Data persists across browser sessions until manually cleared. 
                    Best for forms users might return to later.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">sessionStorage</h4>
                  <p className="text-sm text-muted-foreground">
                    Data persists only for the current browser session. 
                    Best for temporary data or sensitive forms.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Excluding Sensitive Fields</h2>
            <p className="mb-4">
              Use the <code>exclude</code> option to prevent sensitive fields from being saved to storage:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`const { Form } = useFormedible({
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Manual Storage Control</h2>
            <p className="mb-4">
              Access storage functions directly for manual control over when data is saved or cleared:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`const { 
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Multi-Page Forms</h2>
            <p className="mb-4">
              Persistence automatically works with multi-page forms, saving both form data and current page:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`const { Form } = useFormedible({
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Automatic Cleanup</h2>
            <p className="mb-4">
              Form data is automatically cleared from storage when the form is successfully submitted:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`const { Form } = useFormedible({
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">Unique Keys</h3>
                <p className="text-sm text-muted-foreground">
                  Use descriptive, unique keys for each form to avoid conflicts between different forms.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold">Sensitive Data</h3>
                <p className="text-sm text-muted-foreground">
                  Always exclude passwords, credit cards, and other sensitive information from persistence.
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold">Storage Choice</h3>
                <p className="text-sm text-muted-foreground">
                  Use localStorage for forms users might return to later, sessionStorage for temporary data.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold">Debouncing</h3>
                <p className="text-sm text-muted-foreground">
                  Adjust debounce timing based on form complexity - longer for complex forms to reduce storage writes.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
            <p className="mb-4">
              Persistence operations are wrapped in try-catch blocks and will log warnings if storage fails:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`// Storage operations handle errors gracefully
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
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
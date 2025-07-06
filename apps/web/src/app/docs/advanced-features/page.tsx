import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Advanced Features - Formedible",
  description: "Explore all advanced features in Formedible including validation, persistence, analytics, testing, and more.",
};

export default function AdvancedFeaturesPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Advanced Features</h1>
          <p className="text-lg text-muted-foreground">
            Formedible provides a comprehensive set of advanced features to handle complex form scenarios, 
            from validation and persistence to analytics and testing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/docs/validation" className="group">
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">✓</span>
                </div>
                <h3 className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                  Advanced Validation
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Cross-field validation, async validation with loading states, and seamless Zod integration.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Cross-field</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Async</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Debouncing</span>
              </div>
            </div>
          </Link>

          <Link href="/docs/persistence" className="group">
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">💾</span>
                </div>
                <h3 className="text-xl font-semibold group-hover:text-green-600 transition-colors">
                  Form Persistence
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Auto-save form data to browser storage with configurable options and automatic cleanup.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Auto-save</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">localStorage</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Restoration</span>
              </div>
            </div>
          </Link>

          <Link href="/docs/analytics" className="group">
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">📊</span>
                </div>
                <h3 className="text-xl font-semibold group-hover:text-purple-600 transition-colors">
                  Form Analytics
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Track user interactions, completion rates, and performance metrics with built-in analytics.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Tracking</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Metrics</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Events</span>
              </div>
            </div>
          </Link>

          <Link href="/docs/testing" className="group">
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">🧪</span>
                </div>
                <h3 className="text-xl font-semibold group-hover:text-orange-600 transition-colors">
                  Testing Utilities
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Comprehensive testing framework with utilities for validation, async operations, and more.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Jest</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Vitest</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Assertions</span>
              </div>
            </div>
          </Link>

          <Link href="/docs/advanced-fields" className="group">
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-bold">🎛️</span>
                </div>
                <h3 className="text-xl font-semibold group-hover:text-indigo-600 transition-colors">
                  Advanced Field Types
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Specialized field types including location picker, duration input, autocomplete, and masked input.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">Location</span>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">Duration</span>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">Autocomplete</span>
              </div>
            </div>
          </Link>

          <div className="border rounded-lg p-6 bg-muted/50">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-gray-600 font-bold">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-muted-foreground">
                Layout Components
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Grid layouts, tabs, accordions, and stepper components for organizing complex forms.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Grid</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Tabs</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Stepper</span>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Feature Overview</h2>
          
          <div className="space-y-4">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">✅ Completed Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Validation & Logic</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Cross-field validation</li>
                    <li>• Async validation with debouncing</li>
                    <li>• Conditional field rendering</li>
                    <li>• Zod schema integration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Data & Analytics</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Form persistence & auto-save</li>
                    <li>• User interaction tracking</li>
                    <li>• Performance metrics</li>
                    <li>• Completion analytics</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Field Types</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Location picker with maps</li>
                    <li>• Duration input (multiple formats)</li>
                    <li>• Autocomplete with async options</li>
                    <li>• Masked input fields</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Developer Experience</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Comprehensive testing utilities</li>
                    <li>• TypeScript support</li>
                    <li>• Layout components</li>
                    <li>• Multi-page forms</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-yellow-800">🚧 Coming Soon</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2 text-yellow-800">Additional Field Types</h4>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Rich text editor</li>
                    <li>• Code editor with syntax highlighting</li>
                    <li>• Digital signature pad</li>
                    <li>• Time & DateTime pickers</li>
                    <li>• Tags input field</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-yellow-800">Enhanced Features</h4>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Visual form builder</li>
                    <li>• Accessibility enhancements</li>
                    <li>• Internationalization support</li>
                    <li>• Performance optimizations</li>
                    <li>• Framework integrations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Quick Start</h2>
          <p className="text-muted-foreground">
            Get started with advanced features by adding them to your form configuration:
          </p>
          
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`import { useFormedible } from 'formedible';

const { Form } = useFormedible({
  fields: [
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'location', type: 'location', label: 'Location' },
  ],
  
  // Cross-field validation
  crossFieldValidation: [{
    fields: ['email'],
    validator: (values) => values.email ? null : 'Email is required',
    message: 'Please provide an email'
  }],
  
  // Form persistence
  persistence: {
    key: 'my-form',
    storage: 'localStorage',
    restoreOnMount: true
  },
  
  // Analytics tracking
  analytics: {
    onFormStart: (timestamp) => console.log('Form started'),
    onFormComplete: (timeSpent, data) => console.log('Completed', { timeSpent, data })
  }
});`}
            </pre>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold">Performance</h3>
              <p className="text-sm text-muted-foreground">
                Use debouncing for async operations and be mindful of validation frequency.
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold">Privacy</h3>
              <p className="text-sm text-muted-foreground">
                Exclude sensitive fields from persistence and be careful with analytics data.
              </p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold">Testing</h3>
              <p className="text-sm text-muted-foreground">
                Test both success and error scenarios, especially for async operations.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold">User Experience</h3>
              <p className="text-sm text-muted-foreground">
                Provide clear feedback for loading states and validation errors.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
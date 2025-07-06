import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Field Types - Formedible",
  description: "Complete guide to all available field types and their configurations in Formedible.",
};

export default function FieldsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Field Types</h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive guide to all available field types and their configuration options.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Basic Input Fields</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Text Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Standard text input for single-line text entry.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{ name: 'firstName', type: 'text', label: 'First Name' }`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Email Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Email input with built-in validation and appropriate keyboard on mobile.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{ name: 'email', type: 'email', label: 'Email Address' }`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Password Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Password input with toggle visibility option.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{ name: 'password', type: 'password', label: 'Password' }`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Number Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Numeric input with step controls and validation.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'age',
  type: 'number',
  label: 'Age',
  numberConfig: {
    min: 0,
    max: 120,
    step: 1
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Textarea Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Multi-line text input with configurable rows and resize options.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'message',
  type: 'textarea',
  label: 'Message',
  textareaConfig: {
    rows: 4,
    resize: 'vertical'
  }
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Selection Fields</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Select Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Dropdown select with single selection.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'country',
  type: 'select',
  label: 'Country',
  selectConfig: {
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'uk', label: 'United Kingdom' }
    ],
    placeholder: 'Select a country'
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Multi-Select Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Multi-selection dropdown with tags display.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'skills',
  type: 'multiSelect',
  label: 'Skills',
  multiSelectConfig: {
    options: [
      { value: 'js', label: 'JavaScript' },
      { value: 'ts', label: 'TypeScript' },
      { value: 'react', label: 'React' }
    ],
    maxSelections: 5
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Radio Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Radio button group for single selection.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'plan',
  type: 'radio',
  label: 'Subscription Plan',
  radioConfig: {
    options: [
      { value: 'basic', label: 'Basic - $9/month' },
      { value: 'pro', label: 'Pro - $19/month' },
      { value: 'enterprise', label: 'Enterprise - $49/month' }
    ],
    orientation: 'vertical'
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Checkbox Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Single checkbox for boolean values.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'terms',
  type: 'checkbox',
  label: 'I agree to the terms and conditions',
  checkboxConfig: {
    required: true
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Switch Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Toggle switch for boolean values with better UX.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'notifications',
  type: 'switch',
  label: 'Enable Notifications',
  switchConfig: {
    size: 'default'
  }
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Date & Time Fields</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Date Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Date picker with calendar interface.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'birthDate',
  type: 'date',
  label: 'Birth Date',
  dateConfig: {
    format: 'yyyy-MM-dd',
    minDate: new Date('1900-01-01'),
    maxDate: new Date(),
    placeholder: 'Select your birth date'
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Duration Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Duration input with multiple format options.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'meetingDuration',
  type: 'duration',
  label: 'Meeting Duration',
  durationConfig: {
    format: 'hm', // hours and minutes
    maxHours: 8,
    showLabels: true
  }
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Interactive Fields</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Slider Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Range slider for numeric values with visual feedback.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'budget',
  type: 'slider',
  label: 'Budget Range',
  sliderConfig: {
    min: 0,
    max: 10000,
    step: 100,
    formatValue: (value) => \`$\${value}\`
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Rating Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Star rating component for feedback and reviews.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'rating',
  type: 'rating',
  label: 'Rate this product',
  ratingConfig: {
    max: 5,
    allowHalf: true,
    size: 'large',
    showValue: true
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Color Picker Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Color selection with multiple input methods.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'brandColor',
  type: 'color',
  label: 'Brand Color',
  colorConfig: {
    format: 'hex',
    showPresets: true,
    presets: ['#ff0000', '#00ff00', '#0000ff']
  }
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">File & Media Fields</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">File Upload Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  File upload with drag-and-drop support and preview.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'avatar',
  type: 'file',
  label: 'Profile Picture',
  fileConfig: {
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    showPreview: true
  }
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Advanced Fields</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Array Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Dynamic array of fields with add/remove functionality.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'contacts',
  type: 'array',
  label: 'Emergency Contacts',
  arrayConfig: {
    fields: [
      { name: 'name', type: 'text', label: 'Name' },
      { name: 'phone', type: 'tel', label: 'Phone' }
    ],
    minItems: 1,
    maxItems: 5,
    addButtonText: 'Add Contact'
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Location Picker Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Geographic location selection with map interface.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'location',
  type: 'location',
  label: 'Meeting Location',
  locationConfig: {
    apiKey: 'your-maps-api-key',
    enableSearch: true,
    enableGeolocation: true,
    defaultLocation: { lat: 40.7128, lng: -74.0060 }
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Autocomplete Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Search-as-you-type with static or dynamic options.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'user',
  type: 'autocomplete',
  label: 'Select User',
  autocompleteConfig: {
    asyncOptions: async (query) => {
      const response = await fetch(\`/api/users?q=\${query}\`);
      return response.json();
    },
    debounceMs: 300,
    minChars: 2
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Masked Input Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Formatted input for phone numbers, credit cards, etc.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'phone',
  type: 'masked',
  label: 'Phone Number',
  maskedInputConfig: {
    mask: '(999) 999-9999',
    placeholder: '(555) 123-4567',
    showMask: true
  }
}`}</pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Phone Field</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  International phone number input with country selection.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{`{
  name: 'phoneNumber',
  type: 'phone',
  label: 'Phone Number',
  phoneConfig: {
    defaultCountry: 'US',
    preferredCountries: ['US', 'CA', 'GB'],
    format: 'international'
  }
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Field Configuration Options</h2>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Common Properties</h3>
                <p className="text-sm mb-3">All fields support these common configuration options:</p>
                <ul className="text-sm space-y-1">
                  <li>• <code>name</code> - Field identifier (required)</li>
                  <li>• <code>type</code> - Field type (required)</li>
                  <li>• <code>label</code> - Display label (required)</li>
                  <li>• <code>description</code> - Help text below the field</li>
                  <li>• <code>placeholder</code> - Placeholder text</li>
                  <li>• <code>required</code> - Whether field is required</li>
                  <li>• <code>disabled</code> - Whether field is disabled</li>
                  <li>• <code>className</code> - CSS classes for the input</li>
                  <li>• <code>wrapperClassName</code> - CSS classes for the wrapper</li>
                  <li>• <code>page</code> - Page number for multi-page forms</li>
                  <li>• <code>condition</code> - Function to conditionally show field</li>
                  <li>• <code>help</code> - Help text and tooltip configuration</li>
                  <li>• <code>validation</code> - Zod schema for field validation</li>
                </ul>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Conditional Fields</h3>
                <pre className="text-sm overflow-x-auto">
{`{
  name: 'otherReason',
  type: 'textarea',
  label: 'Please specify',
  condition: (values) => values.reason === 'other'
}`}
                </pre>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Help Text</h3>
                <pre className="text-sm overflow-x-auto">
{`{
  name: 'password',
  type: 'password',
  label: 'Password',
  help: {
    text: 'Must be at least 8 characters long',
    tooltip: 'Include uppercase, lowercase, numbers, and symbols'
  }
}`}
                </pre>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">Field Selection</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the most appropriate field type for your data to improve user experience and validation.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold">Labels & Placeholders</h3>
                <p className="text-sm text-muted-foreground">
                  Use clear, descriptive labels and helpful placeholder text to guide users.
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold">Validation</h3>
                <p className="text-sm text-muted-foreground">
                  Combine field-level validation with form-level validation for comprehensive error handling.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold">Accessibility</h3>
                <p className="text-sm text-muted-foreground">
                  All fields include proper ARIA attributes and keyboard navigation support.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
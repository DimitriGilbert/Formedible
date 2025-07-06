import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advanced Field Types - Formedible",
  description: "Explore advanced field types in Formedible including location picker, duration picker, autocomplete, and masked input fields.",
};

export default function AdvancedFieldsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Advanced Field Types</h1>
          <p className="text-lg text-muted-foreground">
            Formedible includes several advanced field types for complex data input scenarios, 
            from location selection to duration input and masked text fields.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Location Picker</h2>
            <p className="mb-4">
              The location picker field allows users to select geographic locations through search, 
              geolocation, or manual coordinate entry.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Basic Usage</h3>
              <pre className="text-sm overflow-x-auto">
{`{
  name: 'location',
  type: 'location',
  label: 'Select Location',
  locationConfig: {
    apiKey: 'your-maps-api-key',
    defaultLocation: { lat: 40.7128, lng: -74.0060 },
    zoom: 13,
    searchPlaceholder: 'Search for a location...',
    enableSearch: true,
    enableGeolocation: true,
    mapProvider: 'google' // or 'openstreetmap'
  }
}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Configuration Options</h3>
              <ul className="text-sm space-y-2">
                <li><code>apiKey</code> - API key for map service (Google Maps, etc.)</li>
                <li><code>defaultLocation</code> - Initial map center coordinates</li>
                <li><code>zoom</code> - Initial zoom level</li>
                <li><code>enableSearch</code> - Enable location search functionality</li>
                <li><code>enableGeolocation</code> - Allow users to use their current location</li>
                <li><code>mapProvider</code> - Choose between 'google' or 'openstreetmap'</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Duration Picker</h2>
            <p className="mb-4">
              The duration picker allows users to input time durations in various formats, 
              from hours and minutes to seconds.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Basic Usage</h3>
              <pre className="text-sm overflow-x-auto">
{`{
  name: 'duration',
  type: 'duration',
  label: 'Duration',
  durationConfig: {
    format: 'hms', // 'hms', 'hm', 'ms', 'hours', 'minutes', 'seconds'
    maxHours: 24,
    maxMinutes: 59,
    maxSeconds: 59,
    showLabels: true,
    allowNegative: false
  }
}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Format Options</h3>
              <ul className="text-sm space-y-2">
                <li><code>hms</code> - Hours, minutes, and seconds (e.g., "2h 30m 15s")</li>
                <li><code>hm</code> - Hours and minutes only (e.g., "2h 30m")</li>
                <li><code>ms</code> - Minutes and seconds only (e.g., "30m 15s")</li>
                <li><code>hours</code> - Hours only with decimal support (e.g., "2.5")</li>
                <li><code>minutes</code> - Minutes only (e.g., "150")</li>
                <li><code>seconds</code> - Seconds only (e.g., "9015")</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Autocomplete Field</h2>
            <p className="mb-4">
              The autocomplete field provides search-as-you-type functionality with support 
              for both static and dynamic option lists.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Static Options</h3>
              <pre className="text-sm overflow-x-auto">
{`{
  name: 'country',
  type: 'autocomplete',
  label: 'Country',
  autocompleteConfig: {
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'de', label: 'Germany' },
    ],
    allowCustom: false,
    placeholder: 'Search countries...',
    noOptionsText: 'No countries found',
    maxResults: 10
  }
}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Async Options</h3>
              <pre className="text-sm overflow-x-auto">
{`{
  name: 'user',
  type: 'autocomplete',
  label: 'Select User',
  autocompleteConfig: {
    asyncOptions: async (query) => {
      const response = await fetch(\`/api/users/search?q=\${query}\`);
      const users = await response.json();
      return users.map(user => ({
        value: user.id,
        label: \`\${user.name} (\${user.email})\`
      }));
    },
    debounceMs: 300,
    minChars: 2,
    maxResults: 20,
    loadingText: 'Searching users...',
    allowCustom: true
  }
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Masked Input Field</h2>
            <p className="mb-4">
              The masked input field applies formatting masks to user input, perfect for 
              phone numbers, credit cards, social security numbers, and other formatted data.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Common Patterns</h3>
              <pre className="text-sm overflow-x-auto">
{`// Phone number
{
  name: 'phone',
  type: 'masked',
  label: 'Phone Number',
  maskedInputConfig: {
    mask: '(999) 999-9999',
    placeholder: '(555) 123-4567',
    showMask: true,
    guide: true
  }
}

// Credit card
{
  name: 'creditCard',
  type: 'masked',
  label: 'Credit Card',
  maskedInputConfig: {
    mask: '9999 9999 9999 9999',
    placeholder: '1234 5678 9012 3456',
    showMask: false,
    guide: false
  }
}

// Social Security Number
{
  name: 'ssn',
  type: 'masked',
  label: 'SSN',
  maskedInputConfig: {
    mask: '999-99-9999',
    placeholder: '123-45-6789',
    showMask: true
  }
}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Custom Mask Function</h3>
              <pre className="text-sm overflow-x-auto">
{`{
  name: 'customFormat',
  type: 'masked',
  label: 'Custom Format',
  maskedInputConfig: {
    mask: (value) => {
      // Custom logic for dynamic masking
      if (value.startsWith('A')) {
        return 'A999-999';
      } else if (value.startsWith('B')) {
        return 'B99-9999';
      }
      return '999-9999';
    },
    placeholder: 'Enter code...',
    pipe: (conformedValue, config) => {
      // Additional processing after masking
      return conformedValue.toUpperCase();
    }
  }
}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Mask Characters</h3>
              <ul className="text-sm space-y-2">
                <li><code>9</code> - Any digit (0-9)</li>
                <li><code>A</code> - Any letter (a-z, A-Z)</li>
                <li><code>S</code> - Any letter or digit</li>
                <li><code>*</code> - Any character</li>
                <li>Any other character is treated as a literal</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Field Integration</h2>
            <p className="mb-4">
              All advanced fields integrate seamlessly with Formedible's validation, analytics, 
              and persistence systems:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Complete Example</h3>
              <pre className="text-sm overflow-x-auto">
{`const { Form } = useFormedible({
  fields: [
    {
      name: 'meetingLocation',
      type: 'location',
      label: 'Meeting Location',
      locationConfig: {
        enableSearch: true,
        enableGeolocation: true
      },
      validation: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().min(1, 'Please select a location')
      })
    },
    {
      name: 'meetingDuration',
      type: 'duration',
      label: 'Meeting Duration',
      durationConfig: {
        format: 'hm',
        maxHours: 8
      },
      validation: z.number().min(15, 'Minimum 15 minutes').max(480, 'Maximum 8 hours')
    },
    {
      name: 'attendee',
      type: 'autocomplete',
      label: 'Select Attendee',
      autocompleteConfig: {
        asyncOptions: async (query) => {
          // Fetch attendees from API
          return await searchAttendees(query);
        },
        debounceMs: 300,
        minChars: 2
      }
    },
    {
      name: 'contactPhone',
      type: 'masked',
      label: 'Contact Phone',
      maskedInputConfig: {
        mask: '(999) 999-9999',
        showMask: true
      },
      validation: z.string().min(14, 'Please enter a valid phone number')
    }
  ],
  // Advanced fields work with all Formedible features
  persistence: {
    key: 'meeting-form',
    storage: 'localStorage'
  },
  analytics: {
    onFieldChange: (fieldName, value) => {
      console.log(\`\${fieldName} changed to:\`, value);
    }
  }
});`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Styling and Customization</h2>
            <p className="mb-4">
              Advanced fields support all standard Formedible styling and customization options:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`{
  name: 'location',
  type: 'location',
  label: 'Location',
  description: 'Select your preferred meeting location',
  wrapperClassName: 'custom-location-wrapper',
  help: {
    text: 'You can search for an address or use your current location',
    tooltip: 'Click the location icon to use GPS'
  },
  locationConfig: {
    // ... configuration
  }
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">Location Picker</h3>
                <p className="text-sm text-muted-foreground">
                  Always provide fallback options when GPS is unavailable and consider privacy implications.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold">Duration Picker</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the appropriate format based on your use case - use 'hm' for meetings, 'hms' for precise timing.
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold">Autocomplete</h3>
                <p className="text-sm text-muted-foreground">
                  Implement proper debouncing for async options and provide clear loading states.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold">Masked Input</h3>
                <p className="text-sm text-muted-foreground">
                  Test masks thoroughly with various input patterns and provide clear examples to users.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Settings,
  MapPin,
  Clock,
  Search,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DocCard } from "@/components/doc-card";
import Link from "next/link";
import { useTheme } from "next-themes";

export const metadata: Metadata = {
  title: "Advanced Field Types - Formedible",
  description:
    "Explore advanced field types in Formedible including location picker, duration picker, autocomplete, and masked input fields.",
};

export default function AdvancedFieldsPage() {
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
                <Settings className="w-3 h-3 mr-1" />
                Advanced Fields
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Sophisticated Input Components
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Formedible includes powerful field types for complex data input
                scenarios, from location selection to duration input and masked
                text fields with rich UX.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Location Picker</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Duration Input</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Search className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Autocomplete</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Masked Fields</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <DocCard
              title="Location Picker"
              description="Enable users to select geographic locations through search, geolocation, or manual coordinate entry."
              icon={MapPin}
            >
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  The location picker field provides an intuitive map interface
                  for location selection, with support for multiple map
                  providers and advanced search capabilities.
                </p>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Basic Usage</h3>
                  <CodeBlock
                    code={`{
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
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Configuration Options
                  </h3>
                  <div className="space-y-2">
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">apiKey</code>
                      <p className="text-sm text-muted-foreground">
                        API key for map service (Google Maps, etc.)
                      </p>
                    </div>
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">
                        defaultLocation
                      </code>
                      <p className="text-sm text-muted-foreground">
                        Initial map center coordinates
                      </p>
                    </div>
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">
                        enableSearch
                      </code>
                      <p className="text-sm text-muted-foreground">
                        Enable location search functionality
                      </p>
                    </div>
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">
                        enableGeolocation
                      </code>
                      <p className="text-sm text-muted-foreground">
                        Allow users to use their current location
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Duration Picker"
              description="Allow users to input time durations in various formats, from hours and minutes to seconds."
              icon={Clock}
            >
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  The duration picker provides a user-friendly interface for
                  time duration input with flexible format options and
                  validation support.
                </p>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Basic Usage</h3>
                  <CodeBlock
                    code={`{
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
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Format Options</h3>
                  <div className="space-y-2">
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">hms</code>
                      <p className="text-sm text-muted-foreground">
                        Hours, minutes, and seconds (e.g., "2h 30m 15s")
                      </p>
                    </div>
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">hm</code>
                      <p className="text-sm text-muted-foreground">
                        Hours and minutes only (e.g., "2h 30m")
                      </p>
                    </div>
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">ms</code>
                      <p className="text-sm text-muted-foreground">
                        Minutes and seconds only (e.g., "30m 15s")
                      </p>
                    </div>
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">hours</code>
                      <p className="text-sm text-muted-foreground">
                        Hours only with decimal support (e.g., "2.5")
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Autocomplete Field"
              description="Provide search-as-you-type functionality with support for both static and dynamic option lists."
              icon={Search}
            >
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  The autocomplete field enhances user experience by providing
                  intelligent search suggestions with both client-side filtering
                  and server-side data fetching capabilities.
                </p>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Static Options</h3>
                  <CodeBlock
                    code={`{
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
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Async Options</h3>
                  <CodeBlock
                    code={`{
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
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Masked Input Field"
              description="Apply formatting masks to user input for phone numbers, credit cards, and other structured data."
              icon={Shield}
            >
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  The masked input field automatically formats user input
                  according to predefined or custom patterns, ensuring data
                  consistency and improving user experience.
                </p>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Common Patterns
                  </h3>
                  <CodeBlock
                    code={`// Phone number
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
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Custom Mask Function
                  </h3>
                  <CodeBlock
                    code={`{
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
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Mask Characters
                  </h3>
                  <div className="space-y-2">
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">9</code>
                      <p className="text-sm text-muted-foreground">
                        Any digit (0-9)
                      </p>
                    </div>
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">A</code>
                      <p className="text-sm text-muted-foreground">
                        Any letter (a-z, A-Z)
                      </p>
                    </div>
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">S</code>
                      <p className="text-sm text-muted-foreground">
                        Any letter or digit
                      </p>
                    </div>
                    <div className="border-l-4 border-primary/20 pl-4">
                      <code className="text-primary font-mono">*</code>
                      <p className="text-sm text-muted-foreground">
                        Any character
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Field Integration"
              description="All advanced fields integrate seamlessly with Formedible's validation, analytics, and persistence systems."
              icon={Layers}
            >
              <CodeBlock
                code={`const { Form } = useFormedible({
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
                language="tsx"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Styling and Customization"
              description="Advanced fields support all standard Formedible styling and customization options."
              icon={Sparkles}
            >
              <CodeBlock
                code={`{
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
                language="tsx"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Best Practices"
              description="Guidelines for effective advanced field implementation and user experience."
              icon={Settings}
            >
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Location Picker</h3>
                  <p className="text-sm text-muted-foreground">
                    Always provide fallback options when GPS is unavailable and
                    consider privacy implications.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-semibold">Duration Picker</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the appropriate format based on your use case - use
                    'hm' for meetings, 'hms' for precise timing.
                  </p>
                </div>

                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-semibold">Autocomplete</h3>
                  <p className="text-sm text-muted-foreground">
                    Implement proper debouncing for async options and provide
                    clear loading states.
                  </p>
                </div>

                <div className="border-l-4 border-muted pl-4">
                  <h3 className="font-semibold">Masked Input</h3>
                  <p className="text-sm text-muted-foreground">
                    Test masks thoroughly with various input patterns and
                    provide clear examples to users.
                  </p>
                </div>
              </div>
            </DocCard>
          </div>

          {/* Ready to Build */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Build Advanced Forms?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Start implementing sophisticated field types that enhance user
                experience. Create forms with location pickers, duration inputs,
                autocomplete, and masked fields.
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

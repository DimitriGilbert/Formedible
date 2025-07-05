export const contactFormCode = `const contactForm = useFormedible({
  schema: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    message: z.string().min(10, "Message must be at least 10 characters"),
    newsletter: z.boolean().optional(),
  }),
  fields: [
    { name: "name", type: "text", label: "Full Name", placeholder: "Enter your full name" },
    { name: "email", type: "email", label: "Email Address", placeholder: "your@email.com" },
    { name: "message", type: "textarea", label: "Message", placeholder: "Tell us what you think..." },
    { name: "newsletter", type: "checkbox", label: "Subscribe to newsletter" },
  ],
  submitLabel: "Send Message",
  formOptions: {
    defaultValues: { 
      name: "",
      email: "",
      message: "",
      newsletter: false 
    },
    onSubmit: async ({ value }) => {
      console.log("Contact form submitted:", value);
      alert("Thank you for your message!");
    },
  },
});

return <contactForm.Form className="space-y-6" />;`;

export const profileFormCode = `const AnimatedFieldWrapper: React.FC<{ children: React.ReactNode; field: any }> = ({ children, field }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    className="space-y-2"
  >
    {children}
  </motion.div>
);

const profileForm = useFormedible({
  schema: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    age: z.number().min(13, "Must be at least 13 years old").max(120, "Invalid age"),
    country: z.string().min(1, "Please select a country"),
    bio: z.string().optional(),
    notifications: z.boolean().default(true),
    newsletter: z.boolean().default(false),
    birthday: z.date().optional(),
  }),
  fields: [
    { name: "firstName", type: "text", label: "First Name", placeholder: "John" },
    { name: "lastName", type: "text", label: "Last Name", placeholder: "Doe" },
    { name: "email", type: "email", label: "Email", placeholder: "john@example.com" },
    { name: "age", type: "number", label: "Age", placeholder: "25", min: 13, max: 120 },
    { 
      name: "country", 
      type: "select", 
      label: "Country", 
      options: ["United States", "Canada", "United Kingdom", "Germany", "France", "Other"] 
    },
    { name: "bio", type: "textarea", label: "Bio", placeholder: "Tell us about yourself..." },
    { name: "notifications", type: "switch", label: "Enable notifications" },
    { name: "newsletter", type: "checkbox", label: "Subscribe to newsletter" },
    { name: "birthday", type: "date", label: "Birthday" },
  ],
  submitLabel: "Update Profile",
  globalWrapper: AnimatedFieldWrapper,
  formOptions: {
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      age: 25,
      country: "",
      bio: "",
      notifications: true,
      newsletter: false,
    },
    onSubmit: async ({ value }) => {
      console.log("Profile updated:", value);
      alert("Profile updated successfully!");
    },
  },
});

return <profileForm.Form className="space-y-6" />;`;

export const surveyFormCode = `const surveyForm = useFormedible({
  schema: z.object({
    satisfaction: z.number().min(1).max(10),
    recommend: z.boolean(),
    feedback: z.string().min(5, "Please provide at least 5 characters of feedback"),
    category: z.string().min(1, "Please select a category"),
  }),
  fields: [
    { name: "satisfaction", type: "slider", label: "Satisfaction (1-10)", min: 1, max: 10 },
    { name: "recommend", type: "switch", label: "Would you recommend us?" },
    { name: "feedback", type: "textarea", label: "Feedback", placeholder: "Your feedback helps us improve..." },
    { 
      name: "category", 
      type: "select", 
      label: "Category", 
      options: ["Product", "Support", "Documentation", "Other"] 
    },
  ],
  submitLabel: "Submit Survey",
  formOptions: {
    defaultValues: { 
      satisfaction: 5,
      recommend: true,
      feedback: "",
      category: ""
    },
    onSubmit: async ({ value }) => {
      console.log("Survey submitted:", value);
      alert("Thank you for your feedback!");
    },
  },
});

return <surveyForm.Form className="space-y-6" />;`;

export const registrationFormCode = `const CustomProgress: React.FC<{
  value: number;
  currentPage: number;
  totalPages: number;
  className?: string;
}> = ({ value, currentPage, totalPages, className }) => (
  <div className={\`space-y-4 \${className}\`}>
    <div className="flex justify-between items-center">
      <h3 className="text-sm font-medium text-muted-foreground">
        Registration Progress
      </h3>
      <span className="text-sm font-bold text-primary">
        {Math.round(value)}% Complete
      </span>
    </div>
    <div className="relative">
      <div className="flex justify-between mb-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <div
            key={i}
            className={\`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors \${
              i + 1 < currentPage
                ? "bg-primary border-primary text-primary-foreground"
                : i + 1 === currentPage
                ? "bg-primary/20 border-primary text-primary"
                : "bg-muted border-muted-foreground/20 text-muted-foreground"
            }\`}
          >
            {i + 1 < currentPage ? "✓" : i + 1}
          </div>
        ))}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: \`\${value}%\` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  </div>
);

const registrationForm = useFormedible({
  schema: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    age: z.number().min(18, "Must be at least 18 years old").max(120, "Invalid age"),
    country: z.string().min(1, "Please select a country"),
    bio: z.string().min(10, "Bio must be at least 10 characters"),
    notifications: z.boolean(),
    newsletter: z.boolean(),
    interests: z.array(z.string()).min(1, "Select at least one interest"),
  }),
  fields: [
    // Page 1: Basic Info
    { name: "firstName", type: "text", label: "First Name", placeholder: "John", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", placeholder: "Doe", page: 1 },
    { name: "email", type: "email", label: "Email Address", placeholder: "john@example.com", page: 1 },
    
    // Page 2: Personal Details
    { name: "age", type: "number", label: "Age", placeholder: "25", min: 18, max: 120, page: 2 },
    { name: "country", type: "select", label: "Country", options: ["United States", "Canada", "United Kingdom", "Germany", "France", "Other"], page: 2 },
    { name: "bio", type: "textarea", label: "Tell us about yourself", placeholder: "Write a short bio...", page: 2 },
    
    // Page 3: Preferences
    { name: "notifications", type: "switch", label: "Enable email notifications", page: 3 },
    { name: "newsletter", type: "checkbox", label: "Subscribe to newsletter", page: 3 },
  ],
  pages: [
    { page: 1, title: "Basic Information", description: "Let's start with your basic details" },
    { page: 2, title: "Personal Details", description: "Tell us more about yourself" },
    { page: 3, title: "Preferences", description: "Customize your experience" },
  ],
  progress: {
    component: CustomProgress,
    className: "mb-6",
  },
  submitLabel: "Complete Registration",
  nextLabel: "Continue →",
  previousLabel: "← Back",
  globalWrapper: AnimatedFieldWrapper,
  formOptions: {
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      age: 18,
      country: "",
      bio: "",
      notifications: true,
      newsletter: false,
      interests: [],
    },
    onSubmit: async ({ value }) => {
      console.log("Registration completed:", value);
      alert("Registration completed successfully!");
    },
  },
  onPageChange: (page, direction) => {
    console.log(\`Navigated to page \${page} via \${direction}\`);
  },
});

return <registrationForm.Form className="space-y-6" />;`;

// Array Field Example
export const arrayFieldExample = `const { Form } = useFormedible({
  fields: [
    {
      name: 'emails',
      type: 'array',
      label: 'Email Addresses',
      description: 'Add multiple email addresses',
      arrayConfig: {
        itemType: 'email',
        itemLabel: 'Email',
        itemPlaceholder: 'Enter email address',
        minItems: 1,
        maxItems: 5,
        addButtonLabel: 'Add Email',
        removeButtonLabel: 'Remove Email',
        defaultValue: '',
      },
    },
    {
      name: 'skills',
      type: 'array',
      label: 'Skills',
      description: 'Rate your skills from 1-10',
      arrayConfig: {
        itemType: 'slider',
        itemLabel: 'Skill',
        minItems: 0,
        maxItems: 10,
        addButtonLabel: 'Add Skill',
        defaultValue: 5,
        itemProps: {
          min: 1,
          max: 10,
          step: 1,
        },
      },
    },
    {
      name: 'ingredients',
      type: 'array',
      label: 'Recipe Ingredients',
      arrayConfig: {
        itemType: 'text',
        itemLabel: 'Ingredient',
        itemPlaceholder: 'e.g., 2 cups flour',
        sortable: true,
        defaultValue: '',
        itemProps: {
          datalist: {
            options: ['flour', 'sugar', 'eggs', 'butter', 'milk'],
            asyncOptions: async (query) => {
              // Simulate API call for ingredient suggestions
              const ingredients = [
                'all-purpose flour', 'whole wheat flour', 'bread flour',
                'granulated sugar', 'brown sugar', 'powdered sugar',
                'large eggs', 'egg whites', 'egg yolks',
                'unsalted butter', 'salted butter', 'coconut oil',
                'whole milk', 'skim milk', 'almond milk'
              ];
              return ingredients.filter(ingredient => 
                ingredient.toLowerCase().includes(query.toLowerCase())
              );
            },
            debounceMs: 300,
            minChars: 2,
            maxResults: 8,
          },
        },
      },
    },
  ],
});`;

// Datalist Example
export const datalistExample = `const { Form } = useFormedible({
  fields: [
    {
      name: 'city',
      type: 'text',
      label: 'City',
      placeholder: 'Start typing a city name...',
      datalist: {
        options: ['New York', 'Los Angeles', 'Chicago', 'Houston'],
        asyncOptions: async (query) => {
          // Simulate API call to city database
          const response = await fetch(\`/api/cities?q=\${query}\`);
          const cities = await response.json();
          return cities.map(city => city.name);
        },
        debounceMs: 500,
        minChars: 3,
        maxResults: 10,
      },
    },
    {
      name: 'country',
      type: 'text',
      label: 'Country',
      placeholder: 'Select a country...',
      datalist: {
        options: [
          'United States', 'Canada', 'United Kingdom', 'France',
          'Germany', 'Italy', 'Spain', 'Australia', 'Japan', 'China'
        ],
      },
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Domain',
      placeholder: 'user@example.com',
      datalist: {
        options: [
          'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
          'icloud.com', 'protonmail.com'
        ],
        asyncOptions: async (query) => {
          // Extract domain from email input
          const atIndex = query.indexOf('@');
          if (atIndex === -1) return [];
          
          const domain = query.substring(atIndex + 1);
          if (domain.length < 2) return [];
          
          // Simulate domain suggestion API
          const domains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'company.com', 'university.edu', 'organization.org'
          ];
          
          return domains
            .filter(d => d.includes(domain))
            .map(d => query.substring(0, atIndex + 1) + d);
        },
        debounceMs: 300,
        minChars: 1,
      },
    },
  ],
});`;

// Complex Array Example with Nested Objects
export const complexArrayExample = `const { Form } = useFormedible({
  fields: [
    {
      name: 'contacts',
      type: 'array',
      label: 'Contact Information',
      description: 'Add multiple contacts with their details',
      arrayConfig: {
        itemType: 'text', // This will be overridden by custom component
        itemLabel: 'Contact',
        minItems: 1,
        maxItems: 10,
        addButtonLabel: 'Add Contact',
        defaultValue: { name: '', email: '', phone: '' },
        itemComponent: ({ fieldApi, label }) => {
          const contact = fieldApi.state.value || {};
          
          return (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium">{label}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <TextField
                  fieldApi={{
                    ...fieldApi,
                    state: { ...fieldApi.state, value: contact.name },
                    handleChange: (value) => fieldApi.handleChange({ ...contact, name: value }),
                  }}
                  label="Name"
                  placeholder="Full name"
                />
                <TextField
                  fieldApi={{
                    ...fieldApi,
                    state: { ...fieldApi.state, value: contact.email },
                    handleChange: (value) => fieldApi.handleChange({ ...contact, email: value }),
                  }}
                  type="email"
                  label="Email"
                  placeholder="email@example.com"
                />
                <TextField
                  fieldApi={{
                    ...fieldApi,
                    state: { ...fieldApi.state, value: contact.phone },
                    handleChange: (value) => fieldApi.handleChange({ ...contact, phone: value }),
                  }}
                  type="tel"
                  label="Phone"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          );
        },
      },
    },
  ],
});`;

// New Field Types Examples
export const newFieldTypesExample = `const { Form } = useFormedible({
  fields: [
    // Radio Button Field
    {
      name: 'paymentMethod',
      type: 'radio',
      label: 'Payment Method',
      options: [
        { value: 'credit', label: 'Credit Card' },
        { value: 'paypal', label: 'PayPal' },
        { value: 'bank', label: 'Bank Transfer' }
      ],
      validation: z.enum(['credit', 'paypal', 'bank']),
      help: {
        text: 'Choose your preferred payment method',
        tooltip: 'This will be used for billing'
      }
    },

    // Multi-Select Field
    {
      name: 'skills',
      type: 'multiSelect',
      label: 'Skills',
      options: ['React', 'TypeScript', 'Node.js', 'Python', 'Go'],
      multiSelectConfig: {
        maxSelections: 5,
        searchable: true,
        creatable: true,
        placeholder: 'Select your skills...'
      },
      validation: z.array(z.string()).min(1, 'Select at least one skill'),
      inlineValidation: {
        enabled: true,
        showSuccess: true,
        asyncValidator: async (skills) => {
          // Simulate API validation
          await new Promise(resolve => setTimeout(resolve, 500));
          return skills.length >= 3 ? null : 'We recommend at least 3 skills';
        }
      }
    },

    // Color Picker Field
    {
      name: 'brandColor',
      type: 'colorPicker',
      label: 'Brand Color',
      colorConfig: {
        format: 'hex',
        showPreview: true,
        presetColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
        allowCustom: true
      },
      validation: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
      help: {
        text: 'Choose your brand primary color',
        link: { url: 'https://coolors.co', text: 'Need color inspiration?' }
      }
    },

    // Rating Field
    {
      name: 'satisfaction',
      type: 'rating',
      label: 'Satisfaction Rating',
      ratingConfig: {
        max: 5,
        allowHalf: true,
        icon: 'star',
        size: 'md',
        showValue: true
      },
      validation: z.number().min(1, 'Please provide a rating'),
      inlineValidation: {
        enabled: true,
        showSuccess: true
      }
    },

    // Phone Field
    {
      name: 'phone',
      type: 'phone',
      label: 'Phone Number',
      phoneConfig: {
        defaultCountry: 'US',
        format: 'international',
        allowedCountries: ['US', 'CA', 'GB', 'FR', 'DE']
      },
      validation: z.string().min(10, 'Phone number is required'),
      help: {
        tooltip: 'We\'ll use this for important updates only',
        position: 'right'
      }
    }
  ]
});`;

// Field Grouping Example
export const fieldGroupingExample = `const { Form } = useFormedible({
  fields: [
    // Personal Information Section
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      section: {
        title: 'Personal Information',
        description: 'Tell us about yourself',
        collapsible: true,
        defaultExpanded: true
      },
      group: 'name',
      validation: z.string().min(2, 'First name is required')
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
      group: 'name',
      validation: z.string().min(2, 'Last name is required')
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      group: 'contact',
      validation: z.string().email('Invalid email address'),
      inlineValidation: {
        enabled: true,
                 asyncValidator: async (email) => {
           // Check if email is already taken
           const response = await fetch('/api/check-email?email=' + email);
           const data = await response.json();
           return data.available ? null : 'Email is already taken';
         }
      }
    },
    {
      name: 'phone',
      type: 'phone',
      label: 'Phone Number',
      group: 'contact',
      phoneConfig: { defaultCountry: 'US', format: 'national' }
    },

    // Preferences Section
    {
      name: 'theme',
      type: 'radio',
      label: 'Theme Preference',
      section: {
        title: 'Preferences',
        description: 'Customize your experience',
        collapsible: true,
        defaultExpanded: false
      },
      options: ['light', 'dark', 'auto'],
      validation: z.enum(['light', 'dark', 'auto'])
    },
    {
      name: 'notifications',
      type: 'multiSelect',
      label: 'Notification Types',
      options: ['email', 'sms', 'push', 'in-app'],
      multiSelectConfig: {
        maxSelections: 3,
        searchable: false
      }
    }
  ]
});`;

// Complete Form Example
export const completeFormExample = `const { Form } = useFormedible({
  fields: [
    // Page 1: Basic Information
    {
      name: 'profile',
      type: 'text',
      label: 'Profile Name',
      page: 1,
      validation: z.string().min(3, 'Profile name must be at least 3 characters'),
      help: {
        text: 'This will be displayed publicly',
        tooltip: 'Choose something memorable!'
      },
      inlineValidation: {
        enabled: true,
        showSuccess: true,
        asyncValidator: async (name) => {
                     const response = await fetch('/api/check-username?name=' + name);
           const data = await response.json();
           return data.available ? null : 'Username is already taken';
         }
       }
     },
     {
       name: 'email',
       type: 'email',
       label: 'Email Address',
       page: 1,
       validation: z.string().email('Please enter a valid email'),
       datalist: {
         asyncOptions: async (query) => {
           // Suggest common email domains
           const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com'];
           return domains
             .filter(domain => query.includes('@') && domain.includes(query.split('@')[1]))
             .map(domain => query.split('@')[0] + '@' + domain);
         },
         debounceMs: 300,
         minChars: 3
       }
     },

     // Page 2: Preferences
     {
       name: 'interests',
       type: 'multiSelect',
       label: 'Interests',
       page: 2,
       options: ['Technology', 'Design', 'Business', 'Science', 'Arts'],
       multiSelectConfig: {
         maxSelections: 3,
         searchable: true,
         creatable: true
       },
       validation: z.array(z.string()).min(1, 'Select at least one interest')
     },
     {
       name: 'experience',
       type: 'rating',
       label: 'Experience Level',
       page: 2,
       ratingConfig: {
         max: 5,
         allowHalf: false,
         icon: 'star',
         showValue: true
       },
       validation: z.number().min(1, 'Please rate your experience')
     },

     // Page 3: Contact Details
     {
       name: 'contacts',
       type: 'array',
       label: 'Contact Methods',
       page: 3,
       arrayConfig: {
         itemType: 'phone',
         itemLabel: 'Phone Number',
         minItems: 1,
         maxItems: 3,
         addButtonLabel: 'Add Phone',
         removeButtonLabel: 'Remove'
       },
       validation: z.array(z.string()).min(1, 'At least one contact method is required')
     }
   ],
   pages: [
     { page: 1, title: 'Basic Information', description: 'Let us start with the basics' },
     { page: 2, title: 'Your Preferences', description: 'Tell us what you are interested in' },
     { page: 3, title: 'Contact Details', description: 'How can we reach you?' }
   ],
   progress: {
     showSteps: true,
     showPercentage: true
   },
   formOptions: {
     onSubmit: async ({ value }) => {
       console.log('Form submitted:', value);
       // Handle form submission
     }
   }
 });`; 
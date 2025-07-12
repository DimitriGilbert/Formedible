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

return <surveyForm.Form className="space-y-6" />;`

// Examples page code examples
export const exampleContactFormCode = `const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.enum(["general", "support", "sales"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
  urgent: z.boolean().default(false),
});

const contactForm = useFormedible({
  schema: contactSchema,
  fields: [
    { name: "name", type: "text", label: "Full Name", placeholder: "John Doe" },
    { name: "email", type: "email", label: "Email", placeholder: "john@example.com" },
    { 
      name: "subject", 
      type: "select", 
      label: "Subject",
      options: [
        { value: "general", label: "General Inquiry" },
        { value: "support", label: "Technical Support" },
        { value: "sales", label: "Sales Question" }
      ]
    },
    { name: "message", type: "textarea", label: "Message", placeholder: "How can we help?" },
    { name: "urgent", type: "checkbox", label: "This is urgent" },
  ],
  formOptions: {
    defaultValues: {
      name: "",
      email: "",
      subject: "general" as const,
      message: "",
      urgent: false,
    },
    onSubmit: async ({ value }) => {
      console.log("Contact form submitted:", value);
      toast.success("Message sent successfully!");
    },
  },
});`;

export const exampleRegistrationFormCode = `const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.date(),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number required"),
  address: z.string().min(5, "Address required"),
  newsletter: z.boolean(),
  notifications: z.boolean(),
  plan: z.enum(["basic", "pro", "enterprise"]),
});

const registrationForm = useFormedible({
  schema: registrationSchema,
  fields: [
    // Page 1 - Personal Info
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", page: 1 },
    { name: "birthDate", type: "date", label: "Birth Date", page: 1 },
    
    // Page 2 - Contact Details
    { name: "email", type: "email", label: "Email", page: 2 },
    { name: "phone", type: "phone", label: "Phone", page: 2 },
    { name: "address", type: "textarea", label: "Address", page: 2 },
    
    // Page 3 - Preferences
    { name: "newsletter", type: "switch", label: "Subscribe to newsletter", page: 3 },
    { name: "notifications", type: "switch", label: "Enable notifications", page: 3 },
    { 
      name: "plan", 
      type: "radio", 
      label: "Choose Plan", 
      page: 3,
      options: [
        { value: "basic", label: "Basic - Free" },
        { value: "pro", label: "Pro - $9/month" },
        { value: "enterprise", label: "Enterprise - $29/month" }
      ]
    },
  ],
  pages: [
    { page: 1, title: "Personal Information", description: "Tell us about yourself" },
    { page: 2, title: "Contact Details", description: "How can we reach you?" },
    { page: 3, title: "Preferences", description: "Customize your experience" },
  ],
  progress: { showSteps: true, showPercentage: true },
});`;

export const exampleSurveyFormCode = `const surveySchema = z.object({
  satisfaction: z.number().min(1).max(5),
  recommend: z.enum(["yes", "maybe", "no"]),
  improvements: z.string().optional(),
  referralSource: z.string().optional(),
  otherSource: z.string().optional(),
  features: z.array(z.string()),
});

const surveyForm = useFormedible({
  schema: surveySchema,
  fields: [
    { 
      name: "satisfaction", 
      type: "rating", 
      label: "How satisfied are you with our service?",
      ratingConfig: { max: 5, allowHalf: false, showValue: true }
    },
    { 
      name: "recommend", 
      type: "radio", 
      label: "Would you recommend us to others?",
      options: [
        { value: "yes", label: "Yes, definitely" },
        { value: "maybe", label: "Maybe" },
        { value: "no", label: "No" }
      ]
    },
    {
      name: "improvements",
      type: "textarea",
      label: "What could we improve?",
      conditional: (values: any) => values.satisfaction < 4,
    },
    {
      name: "features",
      type: "multiSelect",
      label: "Which features do you use most?",
      options: [
        { value: "forms", label: "Form Builder" },
        { value: "validation", label: "Validation" },
        { value: "analytics", label: "Analytics" },
        { value: "integrations", label: "Integrations" },
        { value: "api", label: "API Access" }
      ],
      multiSelectConfig: { maxSelections: 3 }
    }
  ],
});`;

export const exampleCheckoutFormCode = `const checkoutSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(1),
  zipCode: z.string().min(5),
  paymentMethod: z.enum(["card", "paypal", "apple_pay"]),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  shippingMethod: z.enum(["standard", "express", "overnight"]),
  giftMessage: z.string().optional(),
});

const checkoutForm = useFormedible({
  schema: checkoutSchema,
  fields: [
    // Page 1 - Shipping Address
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", page: 1 },
    { name: "email", type: "email", label: "Email", page: 1 },
    { name: "address", type: "text", label: "Address", page: 1 },
    { name: "city", type: "text", label: "City", page: 1 },
    { name: "zipCode", type: "text", label: "ZIP Code", page: 1 },
    
    // Page 2 - Payment Method
    { 
      name: "paymentMethod", 
      type: "radio", 
      label: "Payment Method", 
      page: 2,
      options: [
        { value: "card", label: "Credit/Debit Card" },
        { value: "paypal", label: "PayPal" },
        { value: "apple_pay", label: "Apple Pay" }
      ]
    },
    {
      name: "cardNumber",
      type: "text",
      label: "Card Number",
      page: 2,
      conditional: (values: any) => values.paymentMethod === "card",
      placeholder: "1234 5678 9012 3456"
    },
    
    // Page 3 - Shipping & Review
    { 
      name: "shippingMethod", 
      type: "radio", 
      label: "Shipping Method", 
      page: 3,
      options: [
        { value: "standard", label: "Standard (5-7 days) - Free" },
        { value: "express", label: "Express (2-3 days) - $9.99" },
        { value: "overnight", label: "Overnight - $24.99" }
      ]
    },
    { name: "giftMessage", type: "textarea", label: "Gift Message (Optional)", page: 3 },
  ],
  pages: [
    { page: 1, title: "Shipping Address", description: "Where should we send your order?" },
    { page: 2, title: "Payment", description: "How would you like to pay?" },
    { page: 3, title: "Review & Submit", description: "Review your order" },
  ],
  progress: { showSteps: true },
});`;

export const exampleJobApplicationFormCode = `const jobApplicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  skills: z.array(z.string()).min(1),
  startDate: z.date(),
  salaryExpectation: z.number().min(0),
  whyInterested: z.string().min(10),
  additionalInfo: z.string().optional(),
});

const jobApplicationForm = useFormedible({
  schema: jobApplicationSchema,
  fields: [
    // Page 1 - Personal Information
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", page: 1 },
    { name: "email", type: "email", label: "Email", page: 1 },
    { name: "phone", type: "phone", label: "Phone Number", page: 1 },
    
    // Page 2 - Skills & Experience
    {
      name: "skills",
      type: "multiSelect",
      label: "Technical Skills",
      page: 2,
      options: [
        { value: "javascript", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
        { value: "react", label: "React" },
        { value: "node", label: "Node.js" },
        { value: "python", label: "Python" },
        { value: "java", label: "Java" },
        { value: "sql", label: "SQL" },
        { value: "aws", label: "AWS" },
      ],
      multiSelectConfig: {
        searchable: true,
        creatable: true,
        maxSelections: 10
      }
    },
    { name: "startDate", type: "date", label: "Available Start Date", page: 2 },
    { 
      name: "salaryExpectation", 
      type: "number", 
      label: "Salary Expectation (USD)", 
      page: 2,
      min: 0,
      step: 1000
    },
    
    // Page 3 - Additional Questions
    { 
      name: "whyInterested", 
      type: "textarea", 
      label: "Why are you interested in this position?", 
      page: 3 
    },
    { 
      name: "additionalInfo", 
      type: "textarea", 
      label: "Additional Information", 
      page: 3 
    },
  ],
  pages: [
    { page: 1, title: "Personal Information" },
    { page: 2, title: "Skills & Availability" },
    { page: 3, title: "Additional Questions" },
  ],
  progress: { showSteps: true, showPercentage: true },
});`

// Advanced Examples
export const analyticsTrackingFormCode = `const analyticsSchema = z.object({
  email: z.string().email("Valid email required"),
  companySize: z.enum(["1-10", "11-50", "51-200", "200+"]),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  budget: z.enum(["<10k", "10k-50k", "50k-100k", "100k+"]),
  timeline: z.string().min(1, "Timeline is required"),
  description: z.string().min(20, "Please provide more details"),
});

const analyticsForm = useFormedible({
  schema: analyticsSchema,
  fields: [
    { name: "email", type: "email", label: "Business Email", page: 1 },
    { 
      name: "companySize", 
      type: "select", 
      label: "Company Size", 
      page: 1,
      options: [
        { value: "1-10", label: "1-10 employees" },
        { value: "11-50", label: "11-50 employees" },
        { value: "51-200", label: "51-200 employees" },
        { value: "200+", label: "200+ employees" }
      ]
    },
    {
      name: "interests",
      type: "multiSelect",
      label: "Areas of Interest",
      page: 2,
      options: [
        { value: "web-dev", label: "Web Development" },
        { value: "mobile", label: "Mobile Apps" },
        { value: "ecommerce", label: "E-commerce" },
        { value: "analytics", label: "Analytics" },
        { value: "automation", label: "Automation" }
      ]
    },
    { 
      name: "budget", 
      type: "radio", 
      label: "Project Budget", 
      page: 2,
      options: [
        { value: "<10k", label: "Less than $10,000" },
        { value: "10k-50k", label: "$10,000 - $50,000" },
        { value: "50k-100k", label: "$50,000 - $100,000" },
        { value: "100k+", label: "$100,000+" }
      ]
    },
    { 
      name: "timeline", 
      type: "select", 
      label: "Timeline", 
      page: 3,
      options: ["ASAP", "1-3 months", "3-6 months", "6+ months"]
    },
    { 
      name: "description", 
      type: "textarea", 
      label: "Project Description", 
      page: 3,
      textareaConfig: { rows: 4, showWordCount: true, maxLength: 500 }
    },
  ],
  pages: [
    { page: 1, title: "Company Info", description: "Tell us about your company" },
    { page: 2, title: "Project Details", description: "What are you looking for?" },
    { page: 3, title: "Timeline & Details", description: "When do you need this?" },
  ],
  progress: { showSteps: true, showPercentage: true },
  analytics: {
    onFormStart: (timestamp) => {
      console.log('Form started at:', new Date(timestamp).toISOString());
      gtag('event', 'form_start', { timestamp });
    },
    onFieldFocus: (fieldName, timestamp) => {
      console.log(\`Field \${fieldName} focused at:\`, new Date(timestamp).toISOString());
    },
    onFieldBlur: (fieldName, timeSpent) => {
      console.log(\`Field \${fieldName} completed in \${timeSpent}ms\`);
    },
    onPageChange: (fromPage, toPage, timeSpent) => {
      console.log(\`Page \${fromPage} → \${toPage} (spent \${timeSpent}ms)\`);
      gtag('event', 'form_page_change', { from_page: fromPage, to_page: toPage });
    },
    onFormComplete: (timeSpent, formData) => {
      console.log(\`Form completed in \${timeSpent}ms with data:\`, formData);
      gtag('event', 'form_complete', { 
        time_spent: timeSpent,
        company_size: formData.companySize,
        budget: formData.budget 
      });
    },
    onFormAbandon: (completionPercentage) => {
      console.log(\`Form abandoned at \${completionPercentage}% completion\`);
      gtag('event', 'form_abandon', { completion_percentage: completionPercentage });
    }
  },
});`;

export const persistenceFormCode = `const persistenceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().min(1, "Company is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  projectType: z.array(z.string()).min(1, "Select at least one project type"),
  timeline: z.string().min(1, "Timeline is required"),
  budget: z.string().min(1, "Budget is required"),
  description: z.string().min(50, "Please provide at least 50 characters"),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to terms"),
});

const persistenceForm = useFormedible({
  schema: persistenceSchema,
  fields: [
    // Page 1: Contact Information
    { 
      name: "name", 
      type: "text", 
      label: "Full Name", 
      page: 1,
      section: { title: "Contact Information", description: "Your basic details" }
    },
    { name: "email", type: "email", label: "Email Address", page: 1 },
    { name: "phone", type: "phone", label: "Phone Number", page: 1 },
    { name: "company", type: "text", label: "Company Name", page: 1 },
    { name: "jobTitle", type: "text", label: "Job Title", page: 1 },
    
    // Page 2: Project Details
    {
      name: "projectType",
      type: "multiSelect",
      label: "Project Type",
      page: 2,
      section: { title: "Project Requirements", description: "What do you need help with?" },
      options: [
        { value: "web-dev", label: "Web Development" },
        { value: "mobile-app", label: "Mobile App" },
        { value: "ecommerce", label: "E-commerce Platform" },
        { value: "api", label: "API Development" },
        { value: "consulting", label: "Technical Consulting" }
      ],
      multiSelectConfig: { searchable: true, maxSelections: 3 }
    },
    { 
      name: "timeline", 
      type: "select", 
      label: "Timeline", 
      page: 2,
      options: ["ASAP", "1-3 months", "3-6 months", "6+ months", "Flexible"]
    },
    { 
      name: "budget", 
      type: "radio", 
      label: "Budget Range", 
      page: 2,
      options: [
        { value: "<25k", label: "Less than $25,000" },
        { value: "25k-75k", label: "$25,000 - $75,000" },
        { value: "75k-150k", label: "$75,000 - $150,000" },
        { value: "150k+", label: "$150,000+" }
      ]
    },
    
    // Page 3: Final Details
    { 
      name: "description", 
      type: "textarea", 
      label: "Project Description", 
      page: 3,
      section: { title: "Project Details", description: "Tell us more about your project" },
      textareaConfig: { rows: 6, showWordCount: true, maxLength: 1000 }
    },
    { 
      name: "agreeToTerms", 
      type: "checkbox", 
      label: "I agree to the terms of service and privacy policy", 
      page: 3 
    },
  ],
  pages: [
    { page: 1, title: "Contact Information", description: "Let's start with your details" },
    { page: 2, title: "Project Requirements", description: "Tell us about your project" },
    { page: 3, title: "Final Details", description: "Complete your inquiry" },
  ],
  progress: { showSteps: true, showPercentage: true },
  persistence: {
    key: "project-inquiry-form",
    storage: "localStorage",
    debounceMs: 1500,
    exclude: ["agreeToTerms"], // Don't persist checkbox agreement
    restoreOnMount: true
  },
  formOptions: {
    onSubmit: async ({ value }) => {
      console.log("Form submitted:", value);
      toast.success("Inquiry submitted! We'll be in touch within 24 hours.");
    }
  }
});`;

// Continue with remaining examples
export const arrayFieldsCode = `const arrayFieldsSchema = z.object({
  teamMembers: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    role: z.enum(["developer", "designer", "manager", "qa"]),
    skills: z.array(z.string()),
    startDate: z.date(),
  })).min(1, "At least one team member is required"),
  
  contactMethods: z.array(z.string().email("Must be valid email")).min(1, "At least one contact method required"),
  
  emergencyContacts: z.array(z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(1),
    isPrimary: z.boolean()
  })).max(3, "Maximum 3 emergency contacts"),
});

const arrayFieldsForm = useFormedible({
  schema: arrayFieldsSchema,
  fields: [
    {
      name: "teamMembers",
      type: "array",
      label: "Team Members",
      arrayConfig: {
        itemType: "object",
        itemLabel: "Team Member",
        minItems: 1,
        maxItems: 10,
        sortable: true,
        addButtonLabel: "Add Team Member",
        removeButtonLabel: "Remove Member",
        defaultValue: {
          name: "",
          email: "",
          role: "developer",
          skills: [],
          startDate: new Date(),
        },
      },
    },
    {
      name: "contactMethods",
      type: "array",
      label: "Contact Email Addresses",
      arrayConfig: {
        itemType: "email",
        itemLabel: "Email Address",
        itemPlaceholder: "contact@company.com",
        minItems: 1,
        maxItems: 5,
        addButtonLabel: "Add Email",
        removeButtonLabel: "Remove",
        defaultValue: "",
      },
    },
  ],
});`;

export const advancedFieldTypesCode = `const advancedFieldsSchema = z.object({
  satisfaction: z.number().min(1).max(5),
  phoneNumber: z.string().min(1, "Phone number is required"),
  favoriteColor: z.string().min(1, "Please select a color"),
  workDuration: z.object({
    hours: z.number().min(0),
    minutes: z.number().min(0),
  }).optional(),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  experienceLevel: z.number().min(1).max(10),
  birthDate: z.date(),
  resume: z.any().optional(),
});

const advancedFieldsForm = useFormedible({
  schema: advancedFieldsSchema,
  fields: [
    {
      name: "satisfaction",
      type: "rating",
      label: "How satisfied are you with our service?",
      ratingConfig: {
        max: 5,
        allowHalf: true,
        icon: "star",
        size: "lg",
        showValue: true
      }
    },
    {
      name: "phoneNumber",
      type: "phone",
      label: "Phone Number",
      phoneConfig: {
        defaultCountry: "US",
        format: "international"
      }
    },
    {
      name: "favoriteColor",
      type: "colorPicker",
      label: "Brand Color",
      colorConfig: {
        format: "hex",
        showPreview: true,
        presetColors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00"],
        allowCustom: true
      }
    },
    {
      name: "workDuration",
      type: "duration",
      label: "Daily Work Hours",
      durationConfig: {
        format: "hm",
        maxHours: 24,
        showLabels: true
      }
    },
    {
      name: "skills",
      type: "multiSelect",
      label: "Technical Skills",
      options: [
        { value: "javascript", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
        { value: "react", label: "React" },
        { value: "python", label: "Python" }
      ],
      multiSelectConfig: {
        searchable: true,
        creatable: true,
        maxSelections: 8
      }
    },
    {
      name: "experienceLevel",
      type: "slider",
      label: "Experience Level (1-10)",
      sliderConfig: {
        min: 1,
        max: 10,
        step: 1,
        showTooltip: true,
        showValue: true
      }
    },
    {
      name: "birthDate",
      type: "date",
      label: "Date of Birth",
      dateConfig: {
        maxDate: new Date(),
        minDate: new Date(1900, 0, 1)
      }
    },
    {
      name: "resume",
      type: "file",
      label: "Upload Resume",
      fileConfig: {
        accept: ".pdf,.doc,.docx",
        multiple: false,
        maxSize: 5 * 1024 * 1024
      }
    }
  ],
});`;
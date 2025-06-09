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
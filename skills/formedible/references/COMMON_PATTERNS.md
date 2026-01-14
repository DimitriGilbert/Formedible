# Common Form Patterns

Reusable patterns for common form scenarios in Formedible.

## Dependent Fields

Pattern: Field B options depend on Field A value.

```tsx
const { Form } = useFormedible({
  fields: [
    {
      name: "country",
      type: "select",
      label: "Country",
      options: [
        { value: "us", label: "United States" },
        { value: "ca", label: "Canada" },
        { value: "uk", label: "United Kingdom" },
      ],
    },
    {
      name: "state",
      type: "select",
      label: "State/Province",
      conditional: (values) => !!values.country,
      options: (values) => {
        if (values.country === "us") return US_STATES;
        if (values.country === "ca") return CA_PROVINCES;
        if (values.country === "uk") return UK_REGIONS;
        return [];
      },
    },
  ],
});
```

## Password Confirmation

Pattern: Password field with confirmation and matching validation.

```tsx
const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
});

const { Form } = useFormedible({
  schema,
  fields: [
    {
      name: "password",
      type: "password",
      label: "Password",
      passwordConfig: {
        showStrengthIndicator: true,
      },
    },
    {
      name: "confirmPassword",
      type: "password",
      label: "Confirm Password",
    },
  ],
  crossFieldValidation: [
    {
      fields: ["password", "confirmPassword"],
      validator: (values) => {
        if (values.password !== values.confirmPassword) {
          return "Passwords do not match";
        }
        return null;
      },
    },
  ],
});
```

## Date Range Validation

Pattern: Start date must be before end date.

```tsx
const { Form } = useFormedible({
  fields: [
    {
      name: "startDate",
      type: "date",
      label: "Start Date",
      dateConfig: {
        disablePastDates: true,
      },
    },
    {
      name: "endDate",
      type: "date",
      label: "End Date",
      dateConfig: {
        disablePastDates: true,
        disableDate: (date, values) => {
          if (values.startDate) {
            return date < new Date(values.startDate);
          }
          return false;
        },
      },
    },
  ],
  crossFieldValidation: [
    {
      fields: ["startDate", "endDate"],
      validator: (values) => {
        if (values.startDate && values.endDate && values.startDate > values.endDate) {
          return "Start date must be before end date";
        }
        return null;
      },
    },
  ],
});
```

## Terms and Conditions

Pattern: Checkbox that must be accepted to submit.

```tsx
const schema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

const { Form } = useFormedible({
  schema,
  fields: [
    {
      name: "termsAccepted",
      type: "checkbox",
      label: "I accept the terms and conditions",
      required: true,
      help: {
        link: {
          url: "/terms",
          text: "Read terms and conditions",
        },
      },
    },
  ],
});
```

## Dynamic Field Arrays

Pattern: Add/remove dynamic items.

```tsx
const schema = z.object({
  teamMembers: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.string(),
  })).min(1),
});

const { Form } = useFormedible({
  schema,
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
        defaultValue: {
          name: "",
          email: "",
          role: "developer",
        },
        fields: [
          { name: "name", type: "text", label: "Name" },
          { name: "email", type: "email", label: "Email" },
          {
            name: "role",
            type: "select",
            label: "Role",
            options: [
              { value: "developer", label: "Developer" },
              { value: "designer", label: "Designer" },
              { value: "manager", label: "Manager" },
            ],
          },
        ],
      },
    },
  ],
});
```

## Search with Debounce

Pattern: Search field with async validation.

```tsx
const { Form } = useFormedible({
  fields: [
    {
      name: "username",
      type: "text",
      label: "Username",
    },
  ],
  asyncValidation: {
    username: {
      validator: async (value) => {
        if (!value || value.length < 3) return null;

        const response = await fetch(`/api/check-username/${value}`);
        const { available } = await response.json();

        return available ? null : "Username is already taken";
      },
      debounceMs: 500,
      loadingMessage: "Checking username availability...",
    },
  },
});
```

## Form with Auto-Save

Pattern: Auto-save to localStorage.

```tsx
const { Form } = useFormedible({
  fields: [
    { name: "title", type: "text", label: "Title" },
    { name: "content", type: "textarea", label: "Content" },
  ],
  persistence: {
    key: "blog-post-draft",
    storage: "localStorage",
    debounceMs: 2000,
    exclude: [], // Save all fields
    restoreOnMount: true,
  },
  onFormRestore: (restoredData) => {
    toast.success("Draft restored from previous session");
  },
});
```

## Multi-Page Form with Progress

Pattern: Multi-step wizard with progress tracking.

```tsx
const { Form } = useFormedible({
  fields: [
    // Page 1
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", page: 1 },

    // Page 2
    { name: "email", type: "email", label: "Email", page: 2 },
    { name: "phone", type: "phone", label: "Phone", page: 2 },

    // Page 3
    { name: "company", type: "text", label: "Company", page: 3 },
    { name: "role", type: "text", label: "Role", page: 3 },
  ],
  pages: [
    { page: 1, title: "Personal Information", description: "Tell us about yourself" },
    { page: 2, title: "Contact Details", description: "How can we reach you?" },
    { page: 3, title: "Professional Info", description: "Your work details" },
  ],
  progress: {
    showSteps: true,
    showPercentage: true,
    className: "mb-6",
  },
  analytics: {
    onPageChange: (from, to, timeSpent) => {
      console.log(`User moved from page ${from} to ${to} in ${timeSpent}ms`);
    },
  },
});
```

## Conditional Sections

Pattern: Show entire sections based on conditions.

```tsx
const { Form } = useFormedible({
  fields: [
    {
      name: "accountType",
      type: "radio",
      label: "Account Type",
      options: [
        { value: "individual", label: "Individual" },
        { value: "business", label: "Business" },
      ],
    },
    {
      name: "firstName",
      type: "text",
      label: "First Name",
      conditional: (values) => values.accountType === "individual",
    },
    {
      name: "lastName",
      type: "text",
      label: "Last Name",
      conditional: (values) => values.accountType === "individual",
    },
    {
      name: "companyName",
      type: "text",
      label: "Company Name",
      conditional: (values) => values.accountType === "business",
    },
    {
      name: "taxId",
      type: "text",
      label: "Tax ID",
      conditional: (values) => values.accountType === "business",
    },
  ],
});
```

## Form with Analytics

Pattern: Track all user interactions.

```tsx
const { Form } = useFormedible({
  fields: [
    { name: "email", type: "email", label: "Email" },
    { name: "name", type: "text", label: "Name" },
  ],
  analytics: {
    onFormStart: (timestamp) => {
      gtag("event", "form_start", { timestamp });
    },
    onFieldFocus: (fieldName, timestamp) => {
      gtag("event", "field_focus", { field: fieldName });
    },
    onFieldBlur: (fieldName, timeSpent) => {
      gtag("event", "field_blur", { field: fieldName, duration: timeSpent });
    },
    onFieldError: (fieldName, errors, timestamp) => {
      gtag("event", "field_error", { field: fieldName, errors: errors.length });
    },
    onFormComplete: (timeSpent, data) => {
      gtag("event", "form_complete", { time_spent: timeSpent });
    },
    onFormAbandon: (completion, context) => {
      gtag("event", "form_abandon", {
        completion_percent: completion,
        current_page: context.currentPage,
      });
    },
  },
});
```

## Nested Object Field

Pattern: Group related fields in a collapsible section.

```tsx
const { Form } = useFormedible({
  fields: [
    {
      name: "address",
      type: "object",
      objectConfig: {
        title: "Address Information",
        description: "Enter your complete address",
        collapsible: true,
        collapsed: false,
        fields: [
          { name: "street", type: "text", label: "Street Address" },
          { name: "city", type: "text", label: "City" },
          {
            name: "state",
            type: "select",
            label: "State",
            options: STATE_OPTIONS,
          },
          { name: "zipCode", type: "text", label: "ZIP Code" },
        ],
      },
    },
  ],
});
```

## Tabbed Form

Pattern: Organize fields into tabs.

```tsx
const { Form } = useFormedible({
  fields: [
    { name: "name", type: "text", label: "Name", tab: "personal" },
    { name: "email", type: "email", label: "Email", tab: "personal" },
    { name: "company", type: "text", label: "Company", tab: "professional" },
    { name: "role", type: "text", label: "Role", tab: "professional" },
    { name: "bio", type: "textarea", label: "Bio", tab: "additional" },
  ],
  tabs: [
    { id: "personal", label: "Personal Info" },
    { id: "professional", label: "Professional" },
    { id: "additional", label: "Additional" },
  ],
});
```

## Rating with Custom Icons

Pattern: Custom rating visualization.

```tsx
const { Form } = useFormedible({
  fields: [
    {
      name: "satisfaction",
      type: "rating",
      label: "How satisfied are you?",
      ratingConfig: {
        icon: "heart", // or "star", "thumb"
        max: 5,
        allowHalf: false,
        clearable: true,
        size: "md",
        colors: {
          active: "#ef4444",
          inactive: "#e5e7eb",
        },
      },
    },
  ],
});
```

## File Upload with Validation

Pattern: File upload with size and type restrictions.

```tsx
const { Form } = useFormedible({
  fields: [
    {
      name: "documents",
      type: "file",
      label: "Upload Documents",
      fileConfig: {
        maxFiles: 5,
        maxSize: 5 * 1024 * 1024, // 5MB
        accept: ".pdf,.doc,.docx",
        multiple: true,
        showPreview: true,
      },
    },
  ],
});
```

## Slider with Value Mapping

Pattern: Map slider values to display values.

```tsx
const { Form } = useFormedible({
  fields: [
    {
      name: "energyRating",
      type: "slider",
      label: "Energy Efficiency",
      sliderConfig: {
        min: 1,
        max: 7,
        step: 1,
        valueMapping: [
          { sliderValue: 1, displayValue: "A", label: "Excellent" },
          { sliderValue: 2, displayValue: "B", label: "Very Good" },
          { sliderValue: 3, displayValue: "C", label: "Good" },
          { sliderValue: 4, displayValue: "D", label: "Fair" },
          { sliderValue: 5, displayValue: "E", label: "Poor" },
          { sliderValue: 6, displayValue: "F", label: "Very Poor" },
          { sliderValue: 7, displayValue: "G", label: "Terrible" },
        ],
        showValue: true,
        gradientColors: {
          start: "#22c55e",
          end: "#ef4444",
        },
      },
    },
  ],
});
```

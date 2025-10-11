# Formedible

> **The Ultimate React Form Library for 2025** - A powerful, type-safe wrapper around TanStack Form that makes complex form building effortless.

[![npm](https://img.shields.io/npm/v/formedible)](https://www.npmjs.com/package/formedible)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/github/stars/DimitriGilbert/Formedible)](https://github.com/DimitriGilbert/Formedible)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![TanStack Form](https://img.shields.io/badge/TanStack_Form-v1-orange)](https://tanstack.com/form)

**Formedible** is the **one-stop shop for modern forms** in React. Built on top of TanStack Form v1 (2025), it provides an incredibly powerful yet simple API for creating everything from basic contact forms to complex multi-step wizards with enterprise-grade features.

## 🚀 Why Formedible?

### The Modern Form Building Challenge
Modern web applications demand sophisticated forms that can:
- Handle complex validation scenarios (sync + async)
- Provide real-time user feedback
- Support multi-step workflows
- Persist form state across sessions
- Track user analytics and behavior
- Maintain type safety throughout
- Scale from simple to enterprise-level complexity

### The Formedible Solution
While TanStack Form provides the robust foundation, **Formedible transforms it into a complete form-building ecosystem** that eliminates boilerplate and accelerates development.

## ⚡ Key Features at a Glance

### 🎯 **Core Capabilities**
- **20+ Built-in Field Types** - From basic inputs to advanced components (rating, phone, color picker, location)
- **Schema-First Validation** - Full Zod integration with runtime type safety
- **Multi-Page Forms** - Built-in pagination with progress tracking and validation
- **Tabbed Layouts** - Organize complex forms with tab navigation
- **Conditional Logic** - Show/hide fields and sections based on form state
- **Dynamic Options** - Options for select, radio, and multiSelect fields that update based on other form values
- **Real-time Validation** - Sync and async validation with debouncing
- **Cross-Field Validation** - Validate relationships between multiple fields

### 🏗️ **Advanced Architecture**
- **Unified Field Wrapper System** - Consistent behavior across all 22+ field types with BaseFieldWrapper
- **Enhanced Event System** - Comprehensive event handling through fieldApi.eventHandlers
- **Component Override System** - Replace any field with custom implementations
- **Global & Field-Level Wrappers** - Add animations, styling, or functionality
- **Dynamic Text System** - Template strings with {{fieldName}} syntax for labels, descriptions, and titles
- **Sectioned Forms** - Organize fields into collapsible sections and groups
- **Layout Engine** - Grid, flex, tabs, accordion, and stepper layouts
- **Analytics & Tracking** - Built-in form behavior analytics
- **Form Persistence** - Auto-save to localStorage/sessionStorage with restoration

### 🎨 **Developer Experience**
- **Zero Config Setup** - Works out of the box with sensible defaults
- **Full TypeScript Support** - End-to-end type safety with inference
- **TanStack Form Best Practices** - Optimized subscription patterns and performance
- **shadcn/ui Integration** - Beautiful, accessible components included
- **Unified Field Architecture** - All 22+ field types use consistent BaseFieldWrapper system
- **Enhanced Event Access** - Rich event handling through fieldApi.eventHandlers
- **Extensive Customization** - Override any part of the system

## 📦 Installation

### Via shadcn CLI (Recommended)
```bash
npx shadcn@latest add formedible.dev/r/use-formedible.json
```

### Via npm
```bash
npm install @tanstack/react-form zod
# Then manually install the components and hook
```

## 🏃‍♂️ Quick Start

### 1. Basic Form (30 seconds to working form)

```tsx
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export function ContactForm() {
  const { Form } = useFormedible({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name", placeholder: "John Doe" },
      { name: "email", type: "email", label: "Email", placeholder: "john@example.com" },
      { name: "message", type: "textarea", label: "Message", placeholder: "Your message..." },
    ],
    formOptions: {
      defaultValues: { name: "", email: "", message: "" },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
        // Handle submission
      },
    },
  });

  return <Form />;
}
```

### 2. Multi-Step Registration Form

```tsx
const registrationSchema = z.object({
  // Personal Info (Page 1)
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string(),
  
  // Contact Details (Page 2)
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(5, "Address is required"),
  
  // Preferences (Page 3)
  notifications: z.boolean(),
  newsletter: z.boolean(),
  primarySkill: z.string().min(1, "Please select your primary skill"),
  interests: z.array(z.string()),
});

export function RegistrationWizard() {
  const { Form } = useFormedible({
    schema: registrationSchema,
    fields: [
      // Page 1: Personal Information
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      { name: "dateOfBirth", type: "date", label: "Date of Birth", page: 1 },
      
      // Page 2: Contact Details
      { name: "email", type: "email", label: "Email Address", page: 2 },
      { name: "phone", type: "phone", label: "Phone Number", page: 2, phoneConfig: { format: "international" } },
      { name: "address", type: "textarea", label: "Address", page: 2 },
      
      // Page 3: Preferences
      { name: "notifications", type: "switch", label: "Enable Notifications", page: 3 },
      { name: "newsletter", type: "checkbox", label: "Subscribe to Newsletter", page: 3 },
      { 
        name: "primarySkill", 
        type: "combobox", 
        label: "Primary Skill", 
        page: 3,
        options: [
          { value: "frontend", label: "Frontend Development" },
          { value: "backend", label: "Backend Development" },
          { value: "fullstack", label: "Full Stack Development" },
          { value: "mobile", label: "Mobile Development" },
          { value: "devops", label: "DevOps" },
          { value: "design", label: "UI/UX Design" },
        ],
        comboboxConfig: {
          searchable: true,
          placeholder: "Select your primary skill...",
          searchPlaceholder: "Search skills...",
          noOptionsText: "No skills found."
        }
      },
      { 
        name: "interests", 
        type: "multiSelect", 
        label: "Additional Interests", 
        page: 3,
        options: [
          { value: "tech", label: "Technology" },
          { value: "design", label: "Design" },
          { value: "business", label: "Business" },
          { value: "marketing", label: "Marketing" },
        ]
      },
    ],
    pages: [
      { page: 1, title: "Personal Information", description: "Tell us about yourself" },
      { page: 2, title: "Contact Details", description: "How can we reach you {{firstName}}?" },
      { page: 3, title: "Preferences", description: "Customize your experience" },
    ],
    progress: { showSteps: true, showPercentage: true },
    persistence: {
      key: "registration-form",
      storage: "localStorage",
      restoreOnMount: true,
    },
    analytics: {
      onFormStart: (timestamp) => console.log("Form started at", timestamp),
      onPageChange: (from, to, timeSpent) => console.log(`Page ${from} → ${to} (${timeSpent}ms)`),
      onFormComplete: (timeSpent, data) => console.log("Form completed", { timeSpent, data }),
    },
    formOptions: {
      defaultValues: {
        firstName: "", lastName: "", dateOfBirth: "",
        email: "", phone: "", address: "",
        notifications: true, newsletter: false, primarySkill: "", interests: [],
      },
      onSubmit: async ({ value }) => {
        // Process registration
        await submitRegistration(value);
      },
    },
  });

  return <Form />;
}
```

### 2.1. **Enhanced Slider Field with Custom Visualizations**

The slider field now supports sophisticated custom visualizations that users can click to select values:

```tsx
const ratingForm = useFormedible({
  fields: [
    {
      name: "energyRating",
      type: "slider",
      label: "Energy Efficiency Rating",
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
        visualizationComponent: EnergyRatingComponent, // Custom React component
        showValue: true,
        gradientColors: {
          start: "#22c55e", // Green
          end: "#ef4444",   // Red
        },
      },
    },
  ],
});

// Custom visualization component
const EnergyRatingComponent: React.FC<{
  value: number;
  displayValue: string | number;
  label?: string;
  isActive: boolean;
}> = ({ value, displayValue, label, isActive }) => (
  <div className={`energy-badge ${isActive ? 'active' : ''}`}>
    <div className="rating-letter">{displayValue}</div>
    <div className="rating-label">{label}</div>
  </div>
);
```

**Enhanced Slider Features:**
- **🎯 Click-to-Select**: Click any visualization to instantly set that value
- **⌨️ Keyboard Accessible**: Full keyboard navigation support
- **🎨 Custom Components**: Rich visualization components with animations
- **🌈 Dynamic Gradients**: Color-coded slider tracks based on current value
- **📍 Value Indicators**: Floating tooltips that follow the slider thumb
- **🔗 Visual Connections**: Connecting lines between visualizations and slider

### 2.2. **Enhanced Date Field with Advanced Restrictions**

The date field now supports sophisticated date restrictions and dynamic validation based on form values:

```tsx
const appointmentForm = useFormedible({
  fields: [
    {
      name: "appointmentDate",
      type: "date",
      label: "Select Appointment Date",
      dateConfig: {
        // Disable all past dates
        disablePastDates: true,
        
        // Disable weekends (0=Sunday, 6=Saturday)
        disabledDaysOfWeek: [0, 6],
        
        // Disable specific date ranges
        disabledDateRanges: [
          { from: new Date('2024-12-25'), to: new Date('2024-12-25') }, // Christmas
          { from: new Date('2024-07-01'), to: new Date('2024-07-07') }  // Holiday week
        ],
        
        // Custom disable function with access to form values
        disableDate: (date, formValues) => {
          // Dynamic restrictions based on other fields
          if (formValues?.urgency === 'urgent') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return date < tomorrow; // Only allow dates after tomorrow
          }
          
          if (formValues?.department === 'surgery') {
            // Surgery department only works Mon-Thu
            const dayOfWeek = date.getDay();
            return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // Disable Fri-Sun
          }
          
          return false;
        }
      }
    },
    {
      name: "urgency",
      type: "select",
      label: "Appointment Urgency",
      options: [
        { value: "routine", label: "Routine (2+ weeks)" },
        { value: "urgent", label: "Urgent (1-2 days)" }
      ]
    },
    {
      name: "department",
      type: "select", 
      label: "Department",
      options: [
        { value: "general", label: "General Practice" },
        { value: "surgery", label: "Surgery" }
      ]
    }
  ]
});
```

**Enhanced Date Field Features:**
- **📅 Past/Future Restrictions**: Easily disable all past or future dates
- **📆 Day-of-Week Control**: Block specific weekdays (e.g., weekends)
- **🎯 Date Range Blocking**: Disable specific date ranges (holidays, maintenance)
- **🧠 Dynamic Validation**: Create rules based on other form field values
- **⚡ Real-time Updates**: Restrictions update instantly as form values change
- **🎨 Full Accessibility**: Complete keyboard navigation and screen reader support

## 🎨 Complete Field Types Reference

| Field Type | Component | Description | Special Features |
|------------|-----------|-------------|-----------------|
| `text` | `TextField` | Standard text input | Support for email, password, url, tel subtypes |
| `textarea` | `TextareaField` | Multi-line text input | Word count, auto-resize, max length |
| `number` | `NumberField` | Number input with validation | Min/max, step, precision, spin buttons |
| `date` | `DateField` | Advanced date picker with calendar | Min/max dates, disabled dates, time support, day-of-week restrictions, date ranges, dynamic form-based restrictions |
| `select` | `SelectField` | Dropdown selection | Searchable, clearable, custom options |
| `combobox` | `ComboboxField` | Searchable dropdown with command palette | Fast search, keyboard navigation, click-to-select |
| `multicombobox` | `MultiComboboxField` | Multi-select combobox with command palette | Fast search, keyboard navigation, multiple selections |
| `multiSelect` | `MultiSelectField` | Multiple selection dropdown | Search, create new options, max selections |
| `checkbox` | `CheckboxField` | Boolean checkbox input | Custom styling, indeterminate state |
| `switch` | `SwitchField` | Toggle switch | Smooth animations, custom labels |
| `radio` | `RadioField` | Radio button group | Horizontal/vertical layout, custom styling |
| `slider` | `SliderField` | Interactive range slider | Min/max, step, marks, tooltips, custom visualizations, click-to-select |
| `rating` | `RatingField` | Star rating component | Half stars, custom icons (star/heart/thumb), sizes |
| `phone` | `PhoneField` | International phone input | Country selection, format validation, auto-format |
| `colorPicker` | `ColorPickerField` | Color picker with preview | HEX/RGB/HSL formats, preset colors, custom palette |
| `file` | `FileUploadField` | File upload with drag & drop | Multiple files, size limits, type restrictions, progress |
| `array` | `ArrayField` | Dynamic array of fields | Add/remove items, drag & drop sorting, nested validation |
| `autocomplete` | `AutocompleteField` | Text input with suggestions | Async options, debounced search, custom matching |
| `location` | `LocationPickerField` | Map-based location picker | Google Maps/OpenStreetMap, geolocation, search |
| `duration` | `DurationPickerField` | Time duration input | Hours/minutes/seconds, multiple formats |
| `masked` | `MaskedInputField` | Formatted text input | Phone numbers, dates, credit cards, custom masks |
| `object` | `ObjectField` | Nested object fields | Collapsible sections, custom layouts, deep validation |

## 🧠 Advanced Features Deep Dive

### 1. **Conditional Logic & Dynamic Forms**

```tsx
const dynamicForm = useFormedible({
  fields: [
    { name: "userType", type: "select", label: "User Type", options: ["individual", "business"] },
    
    // Show only for individual users
    { 
      name: "firstName", 
      type: "text", 
      label: "First Name",
      conditional: (values) => values.userType === "individual"
    },
    { 
      name: "lastName", 
      type: "text", 
      label: "Last Name",
      conditional: (values) => values.userType === "individual"
    },
    
    // Show only for business users
    { 
      name: "companyName", 
      type: "text", 
      label: "Company Name",
      conditional: (values) => values.userType === "business"
    },
    { 
      name: "taxId", 
      type: "text", 
      label: "Tax ID",
      conditional: (values) => values.userType === "business"
    },
  ],
  // ... rest of config
});
```

### 1.1. **Dynamic Text with Template Strings**

Formedible supports dynamic text that updates in real-time based on form values. Use `{{fieldName}}` syntax in any user-facing text:

```tsx
const dynamicTextForm = useFormedible({
  fields: [
    // Page 1: Collect user info
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", page: 1 },
    { name: "company", type: "text", label: "Company Name", page: 1 },
    
    // Page 2: Personalized content
    { 
      name: "email", 
      type: "email", 
      label: "Email Address", 
      description: "We'll send updates to this address, {{firstName}}",
      page: 2 
    },
    { 
      name: "phone", 
      type: "phone", 
      label: "Phone Number",
      placeholder: "{{company}} main number",
      page: 2 
    }
  ],
  pages: [
    { 
      page: 1, 
      title: "Personal Information", 
      description: "Tell us about yourself" 
    },
    { 
      page: 2, 
      title: "Contact Details", 
      description: "How can we reach you {{firstName}}?" 
    }
  ],
  // Sections also support dynamic text
  fields: [
    {
      name: "preferences",
      type: "checkbox",
      label: "Marketing Preferences",
      section: {
        title: "Preferences for {{firstName}} {{lastName}}",
        description: "Customize your {{company}} experience"
      }
    }
  ]
});
```

**Dynamic Text Works With:**
- ✅ **Field Labels** - `label: "Welcome {{firstName}}"`
- ✅ **Field Descriptions** - `description: "We'll contact you at {{email}}"`
- ✅ **Field Placeholders** - `placeholder: "{{company}} department"`
- ✅ **Page Titles** - `title: "Settings for {{firstName}}"`
- ✅ **Page Descriptions** - `description: "Review your info {{firstName}}"`
- ✅ **Section Titles** - `section: { title: "{{company}} Details" }`
- ✅ **Section Descriptions** - `section: { description: "Info about {{company}}" }`
- ✅ **Object Field Titles** - `objectConfig: { title: "{{firstName}}'s Address" }`
- ✅ **Button Labels** - `collapseLabel: "Hide {{section}} details"`

**Function-Based Dynamic Text:**

For more complex logic, use functions instead of template strings:

```tsx
const advancedDynamicForm = useFormedible({
  fields: [
    { name: "userType", type: "select", options: ["individual", "business"] },
    { name: "name", type: "text", label: "Full Name" },
    { name: "companyName", type: "text", label: "Company Name" },
    {
      name: "contactMethod",
      type: "select",
      label: (values) => {
        const entity = values.userType === "business" ? values.companyName : values.name;
        return `How should we contact ${entity || "you"}?`;
      },
      description: (values) => {
        if (values.userType === "business") {
          return `Choose the best way to reach ${values.companyName || "your company"}`;
        }
        return `Choose your preferred contact method, ${values.name || "there"}`;
      },
      options: ["email", "phone", "mail"]
    }
  ]
});
```

**Performance Optimized:**
- Uses efficient TanStack Form subscriptions
- Only updates when referenced field values change
- Minimal re-renders with targeted subscriptions
- Fallback to literal text when values are empty

### 1.2. **Dynamic Options Based on Form State**

```tsx
const locationForm = useFormedible({
  fields: [
    {
      name: "country",
      type: "select",
      label: "Country",
      options: [
        { value: "us", label: "United States" },
        { value: "ca", label: "Canada" },
        { value: "uk", label: "United Kingdom" },
        { value: "au", label: "Australia" }
      ]
    },
    {
      name: "state",
      type: "select",
      label: "State/Province",
      conditional: (values) => !!values.country, // Only show if country is selected
      options: (values) => {
        // Dynamic options based on selected country
        if (values.country === "us") {
          return [
            { value: "ca", label: "California" },
            { value: "ny", label: "New York" },
            { value: "tx", label: "Texas" },
            { value: "fl", label: "Florida" }
          ];
        } else if (values.country === "ca") {
          return [
            { value: "on", label: "Ontario" },
            { value: "qc", label: "Quebec" },
            { value: "bc", label: "British Columbia" },
            { value: "ab", label: "Alberta" }
          ];
        } else if (values.country === "uk") {
          return [
            { value: "england", label: "England" },
            { value: "scotland", label: "Scotland" },
            { value: "wales", label: "Wales" },
            { value: "ni", label: "Northern Ireland" }
          ];
        } else if (values.country === "au") {
          return [
            { value: "nsw", label: "New South Wales" },
            { value: "vic", label: "Victoria" },
            { value: "qld", label: "Queensland" },
            { value: "wa", label: "Western Australia" }
          ];
        }
        return []; // No options if country not selected
      }
    },
    {
      name: "city",
      type: "autocomplete",
      label: "City",
      conditional: (values) => !!values.state,
      autocompleteConfig: {
        // Dynamic autocomplete options based on state
        options: (values) => {
          if (values.state === "ca") {
            return ["Los Angeles", "San Francisco", "San Diego", "Sacramento"];
          } else if (values.state === "ny") {
            return ["New York City", "Buffalo", "Rochester", "Syracuse"];
          }
          // ... more state-specific cities
          return [];
        },
        allowCustom: true
      }
    }
  ],
  // ... rest of config
});
```

**Dynamic Options Work With:**
- `select` fields - Dropdown selections
- `radio` fields - Radio button groups  
- `multiSelect` fields - Multiple selection dropdowns
- `autocomplete` fields - Auto-complete suggestions

**Key Benefits:**
- **Responsive UX** - Options update instantly as users make selections
- **Reduced Cognitive Load** - Only relevant options are shown
- **Data Integrity** - Prevents invalid combinations
- **Performance** - Efficient re-rendering using TanStack Form subscriptions

### 2. **Cross-Field Validation**

```tsx
const passwordForm = useFormedible({
  crossFieldValidation: [
    {
      fields: ["password", "confirmPassword"],
      validator: (values) => {
        if (values.password !== values.confirmPassword) {
          return "Passwords do not match";
        }
        return null;
      },
      message: "Password confirmation must match",
    },
    {
      fields: ["startDate", "endDate"],
      validator: (values) => {
        if (values.startDate && values.endDate && values.startDate > values.endDate) {
          return "Start date must be before end date";
        }
        return null;
      },
      message: "Invalid date range",
    },
  ],
  // ... rest of config
});
```

### 3. **Async Validation with Real-Time Feedback**

```tsx
const signupForm = useFormedible({
  asyncValidation: {
    username: {
      validator: async (value) => {
        if (!value || value.length < 3) return null;
        
        const response = await fetch(`/api/check-username/${value}`);
        const { available } = await response.json();
        
        return available ? null : "Username is already taken";
      },
      debounceMs: 500,
      loadingMessage: "Checking availability...",
    },
    email: {
      validator: async (value) => {
        if (!value) return null;
        
        const response = await fetch(`/api/validate-email/${value}`);
        const { valid, reason } = await response.json();
        
        return valid ? null : reason;
      },
      debounceMs: 800,
    },
  },
  // ... rest of config
});
```

### 4. **Advanced Form Analytics & User Behavior Tracking**

Formedible provides comprehensive analytics to understand user behavior and optimize form performance:

```tsx
const analyticsForm = useFormedible({
  analytics: {
    // Form lifecycle events
    onFormStart: (timestamp) => {
      // Track form initiation - only fires once per session
      analytics.track("form_started", { timestamp, formId: "contact" });
    },
    
    onFormComplete: (timeSpent, formData) => {
      // Track successful submissions with rich context
      analytics.track("form_completed", { 
        timeSpent, 
        fieldCount: Object.keys(formData).length,
        conversionTime: timeSpent
      });
    },
    
    onFormAbandon: (completionPercentage, context) => {
      // Track form abandonment - FIXED: Only fires on actual page leave, not navigation
      analytics.track("form_abandoned", { 
        completionPercentage,
        currentPage: context.currentPage,
        currentTab: context.currentTab,
        lastActiveField: context.lastActiveField
      });
    },
    
    // Field interaction tracking
    onFieldFocus: (fieldName, timestamp) => {
      // Track field interactions for user journey analysis
      analytics.track("field_focused", { fieldName, timestamp });
    },
    
    onFieldBlur: (fieldName, timeSpent) => {
      // Track time spent on fields for UX optimization
      analytics.track("field_completed", { fieldName, timeSpent });
    },
    
    onFieldChange: (fieldName, value, timestamp) => {
      // Track field value changes (be mindful of PII)
      analytics.track("field_changed", { 
        fieldName, 
        hasValue: !!value,
        timestamp 
      });
    },
    
    onFieldError: (fieldName, errors, timestamp) => {
      // Track validation errors for form optimization
      analytics.track("field_error", { 
        fieldName, 
        errorCount: errors.length,
        firstError: errors[0],
        timestamp 
      });
    },
    
    onFieldComplete: (fieldName, isValid, timeSpent) => {
      // Track successful field completion
      analytics.track("field_complete", { 
        fieldName, 
        isValid, 
        timeSpent 
      });
    },
    
    // Multi-page form tracking
    onPageChange: (fromPage, toPage, timeSpent, pageContext) => {
      // Track multi-page navigation with rich context
      analytics.track("page_changed", { 
        fromPage, 
        toPage, 
        timeSpent,
        hasErrors: pageContext.hasErrors,
        completionPercentage: pageContext.completionPercentage
      });
    },
    
    // Tab-based form tracking
    onTabChange: (fromTab, toTab, timeSpent, tabContext) => {
      // Track tab navigation in tabbed forms
      analytics.track("tab_changed", { 
        fromTab, 
        toTab, 
        timeSpent,
        completionPercentage: tabContext.completionPercentage,
        hasErrors: tabContext.hasErrors
      });
    },
    
    onTabFirstVisit: (tabId, timestamp) => {
      // Track first-time tab visits
      analytics.track("tab_first_visit", { tabId, timestamp });
    },
    
    // Performance tracking
    onSubmissionPerformance: (totalTime, validationTime, processingTime) => {
      // Track form performance metrics
      analytics.track("form_performance", {
        totalTime,
        validationTime,
        processingTime,
        efficiency: (processingTime / totalTime) * 100
      });
    }
  },
  // ... rest of config
});
```

**Key Analytics Features:**

- **🔄 Fixed Abandonment Tracking**: No longer triggers on page navigation within forms
- **📊 Rich Context**: All events include relevant metadata and timing information
- **🎯 Field-Level Insights**: Track user behavior at the individual field level
- **⏱️ Performance Metrics**: Monitor form rendering and submission performance
- **🛣️ User Journey Mapping**: Understand how users navigate through complex forms
- **🔍 Error Analytics**: Identify problematic fields and validation issues
- **📈 Conversion Optimization**: Data-driven insights for form improvement

### 5. **Form Persistence & Auto-Save**

```tsx
const persistentForm = useFormedible({
  persistence: {
    key: "contact-form-draft",
    storage: "localStorage", // or "sessionStorage"
    debounceMs: 1000, // Auto-save every second
    exclude: ["password", "creditCard"], // Don't persist sensitive fields
    restoreOnMount: true, // Restore on page reload
  },
  
  // Optional: Handle restoration events
  onFormRestore: (restoredData) => {
    console.log("Form data restored:", restoredData);
    // Show notification to user
    showNotification("Draft restored from your last session");
  },
  
  // ... rest of config
});
```

### 6. **Advanced Component Customization**

```tsx
// Custom field component
const AnimatedTextField: React.FC<FieldComponentProps> = ({ fieldApi, label, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <TextField
        {...props}
        fieldApi={fieldApi}
        label={label}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(props.className, isFocused && "ring-2 ring-blue-500")}
      />
      {fieldApi.state.meta.errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -bottom-6 left-0 text-red-500 text-xs"
        >
          {fieldApi.state.meta.errors[0]}
        </motion.div>
      )}
    </motion.div>
  );
};

// Custom wrapper for all fields
const FormFieldWrapper: React.FC<{ children: React.ReactNode; field: FieldConfig }> = ({ 
  children, 
  field 
}) => (
  <div className={cn(
    "relative p-4 border rounded-lg transition-all duration-200",
    field.group === "important" && "border-amber-300 bg-amber-50",
    field.section?.title && "border-l-4 border-l-blue-500"
  )}>
    {children}
  </div>
);

const customizedForm = useFormedible({
  fields: [
    {
      name: "email",
      type: "email",
      label: "Email Address",
      component: AnimatedTextField, // Use custom component
      group: "important",
    },
  ],
  globalWrapper: FormFieldWrapper, // Apply to all fields
  defaultComponents: {
    email: AnimatedTextField, // Override default email component
  },
  // ... rest of config
});
```

### 7. **Complex Array Fields with Nested Validation**

```tsx
const teamMembersForm = useFormedible({
  schema: z.object({
    teamMembers: z.array(z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email required"),
      role: z.enum(["developer", "designer", "manager"]),
      skills: z.array(z.string()),
    })).min(1, "At least one team member is required"),
  }),
  
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
        removeButtonLabel: "Remove",
        defaultValue: {
          name: "",
          email: "",
          role: "developer",
          skills: [],
        },
        itemValidation: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          role: z.enum(["developer", "designer", "manager"]),
          skills: z.array(z.string()),
        }),
      },
    },
  ],
  // ... rest of config
});
```

## 🎛️ Complete API Reference

### `useFormedible<TFormValues>(options: UseFormedibleOptions<TFormValues>)`

**Returns:**
```typescript
{
  form: TanStackFormInstance<TFormValues>;
  Form: React.FC<FormProps>;
  currentPage: number;
  totalPages: number;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setCurrentPage: (page: number) => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  progressValue: number;
  crossFieldErrors: Record<string, string>;
  asyncValidationStates: Record<string, { loading: boolean; error?: string }>;
  validateCrossFields: (values: Partial<TFormValues>) => Record<string, string>;
  validateFieldAsync: (fieldName: string, value: unknown) => Promise<void>;
  saveToStorage: (values: Partial<TFormValues>) => void;
  loadFromStorage: () => any;
  clearStorage: () => void;
}
```

### Core Options

```typescript
interface UseFormedibleOptions<TFormValues> {
  // Form Configuration
  fields?: FieldConfig[];
  schema?: z.ZodSchema<TFormValues>;
  formOptions?: TanStackFormOptions<TFormValues>;
  
  // UI Customization
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  formClassName?: string;
  fieldClassName?: string;
  showSubmitButton?: boolean;
  
  // Multi-page Support
  pages?: PageConfig[];
  progress?: ProgressConfig;
  onPageChange?: (page: number, direction: 'next' | 'previous') => void;
  
  // Tabbed Layout
  tabs?: TabConfig[];
  
  // Component Overrides
  defaultComponents?: Record<string, React.ComponentType<FieldComponentProps>>;
  globalWrapper?: React.ComponentType<{ children: React.ReactNode; field: FieldConfig }>;
  
  // Form Behavior
  autoSubmitOnChange?: boolean;
  autoSubmitDebounceMs?: number;
  disabled?: boolean;
  loading?: boolean;
  resetOnSubmitSuccess?: boolean;
  
  // Advanced Validation
  crossFieldValidation?: CrossFieldValidationConfig[];
  asyncValidation?: Record<string, AsyncValidationConfig>;
  
  // Analytics & Tracking
  analytics?: AnalyticsConfig;
  
  // Layout & Conditional Logic
  layout?: LayoutConfig;
  conditionalSections?: ConditionalSectionConfig[];
  
  // Form Persistence
  persistence?: PersistenceConfig;
  
  // Form-level Event Handlers
  onFormReset?: (e: React.FormEvent, formApi: TanStackFormInstance<TFormValues>) => void;
  onFormInput?: (e: React.FormEvent, formApi: TanStackFormInstance<TFormValues>) => void;
  onFormInvalid?: (e: React.FormEvent, formApi: TanStackFormInstance<TFormValues>) => void;
  onFormKeyDown?: (e: React.KeyboardEvent, formApi: TanStackFormInstance<TFormValues>) => void;
  onFormKeyUp?: (e: React.KeyboardEvent, formApi: TanStackFormInstance<TFormValues>) => void;
  onFormFocus?: (e: React.FocusEvent, formApi: TanStackFormInstance<TFormValues>) => void;
  onFormBlur?: (e: React.FocusEvent, formApi: TanStackFormInstance<TFormValues>) => void;
}
```

## 🔧 Field Configuration Schema

### Base Field Config
```typescript
interface FieldConfig {
  // Required
  name: string;
  type: string;
  
  // Basic Properties
  label?: string;
  placeholder?: string;
  description?: string;
  options?: string[] | { value: string; label: string }[] | ((values: Record<string, unknown>) => string[] | { value: string; label: string }[]); // Static or dynamic options
  
  // Validation & Logic
  validation?: z.ZodSchema<unknown>;
  conditional?: (values: Record<string, unknown>) => boolean;
  dependencies?: string[];
  
  // Layout & Organization
  page?: number;
  tab?: string;
  group?: string;
  section?: SectionConfig;
  
  // Customization
  component?: React.ComponentType<FieldComponentProps>;
  wrapper?: React.ComponentType<{ children: React.ReactNode; field: FieldConfig }>;
  
  // Field-Specific Configurations
  arrayConfig?: ArrayFieldConfig;
  phoneConfig?: PhoneFieldConfig;
  colorConfig?: ColorFieldConfig;
  multiSelectConfig?: MultiSelectFieldConfig;
  locationConfig?: LocationFieldConfig;
  durationConfig?: DurationFieldConfig;
  autocompleteConfig?: AutocompleteFieldConfig;
  maskedInputConfig?: MaskedInputFieldConfig;
  objectConfig?: ObjectFieldConfig;
  sliderConfig?: SliderFieldConfig;
  numberConfig?: NumberFieldConfig;
  dateConfig?: DateFieldConfig;
  fileConfig?: FileFieldConfig;
  textareaConfig?: TextareaFieldConfig;
  passwordConfig?: PasswordFieldConfig;
  emailConfig?: EmailFieldConfig;
  ratingConfig?: RatingFieldConfig;
  
  // Help & Inline Validation
  help?: HelpConfig;
  inlineValidation?: InlineValidationConfig;
  validationConfig?: SimpleValidationConfig;
}
```

## 🏗️ Architecture & Best Practices

### TanStack Form Integration
Formedible follows **TanStack Form v1 best practices** (2025):

1. **Subscription Optimization**: Uses targeted selectors to minimize re-renders
2. **Conditional Rendering**: Implements efficient conditional field rendering
3. **Validation Patterns**: Supports both sync and async validation with proper debouncing
4. **State Management**: Leverages TanStack Form's granular reactivity
5. **Performance**: Optimized subscription patterns prevent unnecessary re-renders

### Performance Optimizations

```tsx
// ✅ Good: Targeted subscription
<form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit })}>
  {({ canSubmit }) => <Button disabled={!canSubmit}>Submit</Button>}
</form.Subscribe>

// ❌ Bad: Full state subscription
<form.Subscribe>
  {(state) => <Button disabled={!state.canSubmit}>Submit</Button>}
</form.Subscribe>
```

### TypeScript Best Practices

```tsx
// Define your form schema
const contactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(18),
});

// Infer TypeScript types
type ContactFormValues = z.infer<typeof contactSchema>;

// Use with full type safety
const { Form } = useFormedible<ContactFormValues>({
  schema: contactSchema,
  formOptions: {
    defaultValues: {
      name: "", // ✅ Type-safe
      email: "", // ✅ Type-safe
      age: 18, // ✅ Type-safe
      // invalid: "" // ❌ TypeScript error
    },
    onSubmit: async ({ value }) => {
      // value is fully typed as ContactFormValues
      console.log(value.name); // ✅ Type-safe access
    },
  },
});
```

## 🛠️ Real-World Examples

### Enterprise Contact Form with All Features

```tsx
const enterpriseContactSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  
  // Company Information
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]),
  industry: z.string().min(1, "Please select an industry"),
  
  // Project Details
  projectType: z.array(z.string()).min(1, "Please select at least one project type"),
  budget: z.enum(["<10k", "10k-50k", "50k-100k", "100k+"]),
  timeline: z.string().min(1, "Please select a timeline"),
  description: z.string().min(50, "Please provide at least 50 characters"),
  
  // Preferences
  preferredContact: z.enum(["email", "phone", "either"]),
  newsletter: z.boolean(),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
});

type EnterpriseContactForm = z.infer<typeof enterpriseContactSchema>;

export function EnterpriseContactForm() {
  const { Form } = useFormedible<EnterpriseContactForm>({
    schema: enterpriseContactSchema,
    
    fields: [
      // Page 1: Personal Information
      {
        name: "firstName",
        type: "text",
        label: "First Name",
        placeholder: "John",
        page: 1,
        section: { title: "Personal Information", description: "Tell us about yourself" },
        inlineValidation: { enabled: true, showSuccess: true }
      },
      {
        name: "lastName",
        type: "text",
        label: "Last Name",
        placeholder: "Doe",
        page: 1,
        inlineValidation: { enabled: true, showSuccess: true }
      },
      {
        name: "email",
        type: "email",
        label: "Email Address",
        placeholder: "john.doe@company.com",
        page: 1,
        help: {
          tooltip: "We'll use this to send you updates about your inquiry",
          position: "top"
        }
      },
      {
        name: "phone",
        type: "phone",
        label: "Phone Number",
        page: 1,
        phoneConfig: {
          format: "international",
          defaultCountry: "US"
        }
      },
      
      // Page 2: Company Information
      {
        name: "companyName",
        type: "text",
        label: "Company Name",
        placeholder: "Acme Corporation",
        page: 2,
        section: { title: "Company Information", description: "Help us understand your organization" }
      },
      {
        name: "jobTitle",
        type: "text",
        label: "Job Title",
        placeholder: "CEO, CTO, Marketing Director, etc.",
        page: 2
      },
      {
        name: "companySize",
        type: "select",
        label: "Company Size",
        page: 2,
        options: [
          { value: "1-10", label: "1-10 employees" },
          { value: "11-50", label: "11-50 employees" },
          { value: "51-200", label: "51-200 employees" },
          { value: "201-1000", label: "201-1000 employees" },
          { value: "1000+", label: "1000+ employees" }
        ]
      },
      {
        name: "industry",
        type: "autocomplete",
        label: "Industry",
        page: 2,
        autocompleteConfig: {
          options: [
            "Technology", "Healthcare", "Finance", "Education", "Retail",
            "Manufacturing", "Real Estate", "Professional Services",
            "Non-profit", "Government", "Other"
          ],
          allowCustom: true,
          placeholder: "Start typing your industry..."
        }
      },
      
      // Page 3: Project Details
      {
        name: "projectType",
        type: "multiSelect",
        label: "Project Type",
        page: 3,
        section: { title: "Project Details", description: "Tell us about your project requirements" },
        options: [
          { value: "web-development", label: "Web Development" },
          { value: "mobile-app", label: "Mobile App" },
          { value: "ecommerce", label: "E-commerce" },
          { value: "cms", label: "Content Management" },
          { value: "api", label: "API Development" },
          { value: "consulting", label: "Consulting" },
          { value: "maintenance", label: "Maintenance & Support" }
        ],
        multiSelectConfig: {
          searchable: true,
          maxSelections: 3
        }
      },
      {
        name: "budget",
        type: "radio",
        label: "Project Budget",
        page: 3,
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
        label: "Desired Timeline",
        page: 3,
        options: [
          { value: "asap", label: "As soon as possible" },
          { value: "1-3months", label: "1-3 months" },
          { value: "3-6months", label: "3-6 months" },
          { value: "6months+", label: "6+ months" },
          { value: "flexible", label: "Flexible" }
        ]
      },
      {
        name: "description",
        type: "textarea",
        label: "Project Description",
        placeholder: "Please describe your project requirements, goals, and any specific features you need...",
        page: 3,
        textareaConfig: {
          rows: 6,
          showWordCount: true,
          maxLength: 2000
        }
      },
      
      // Page 4: Preferences & Confirmation
      {
        name: "preferredContact",
        type: "radio",
        label: "Preferred Contact Method",
        page: 4,
        section: { title: "Contact Preferences", description: "How would you like us to reach you?" },
        options: [
          { value: "email", label: "Email" },
          { value: "phone", label: "Phone" },
          { value: "either", label: "Either email or phone" }
        ]
      },
      {
        name: "newsletter",
        type: "checkbox",
        label: "Subscribe to our newsletter for industry insights and updates",
        page: 4
      },
      {
        name: "termsAccepted",
        type: "checkbox",
        label: "I accept the terms of service and privacy policy",
        page: 4,
        help: {
          link: { url: "/terms", text: "Read our terms and privacy policy" }
        }
      }
    ],
    
    pages: [
      { page: 1, title: "Personal Information", description: "Let's start with your basic information" },
      { page: 2, title: "Company Details", description: "Tell us about your organization" },
      { page: 3, title: "Project Requirements", description: "Describe your project needs" },
      { page: 4, title: "Review & Submit", description: "Review your information and submit" }
    ],
    
    progress: {
      showSteps: true,
      showPercentage: true,
      className: "mb-8"
    },
    
    // Cross-field validation
    crossFieldValidation: [
      {
        fields: ["projectType", "budget"],
        validator: (values) => {
          if (values.projectType?.includes("mobile-app") && values.budget === "<10k") {
            return "Mobile app projects typically require a higher budget";
          }
          return null;
        },
        message: "Budget may be insufficient for selected project type"
      }
    ],
    
    // Async validation
    asyncValidation: {
      email: {
        validator: async (email) => {
          if (!email) return null;
          const response = await fetch(`/api/validate-email/${email}`);
          const { isValid, isCorporate } = await response.json();
          
          if (!isValid) return "Please enter a valid email address";
          if (!isCorporate) return "Please use your corporate email address";
          
          return null;
        },
        debounceMs: 800,
        loadingMessage: "Validating email address..."
      },
      companyName: {
        validator: async (companyName) => {
          if (!companyName || companyName.length < 2) return null;
          
          const response = await fetch(`/api/verify-company/${encodeURIComponent(companyName)}`);
          const { exists, suggestion } = await response.json();
          
          if (!exists && suggestion) {
            return `Did you mean "${suggestion}"?`;
          }
          
          return null;
        },
        debounceMs: 1000
      }
    },
    
    // Form persistence
    persistence: {
      key: "enterprise-contact-form",
      storage: "localStorage",
      debounceMs: 2000,
      exclude: ["termsAccepted"], // Don't persist acceptance
      restoreOnMount: true
    },
    
    // Analytics tracking
    analytics: {
      onFormStart: (timestamp) => {
        gtag('event', 'form_start', {
          event_category: 'engagement',
          event_label: 'enterprise_contact_form',
          timestamp
        });
      },
      onPageChange: (fromPage, toPage, timeSpent) => {
        gtag('event', 'form_page_change', {
          event_category: 'engagement',
          from_page: fromPage,
          to_page: toPage,
          time_spent: timeSpent
        });
      },
      onFormComplete: (timeSpent, formData) => {
        gtag('event', 'form_complete', {
          event_category: 'conversion',
          event_label: 'enterprise_contact_form',
          time_spent: timeSpent,
          company_size: formData.companySize,
          budget: formData.budget
        });
      },
      onFormAbandon: (completionPercentage) => {
        gtag('event', 'form_abandon', {
          event_category: 'engagement',
          completion_percentage: completionPercentage
        });
      }
    },
    
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: "",
        jobTitle: "",
        companySize: "1-10",
        industry: "",
        projectType: [],
        budget: "10k-50k",
        timeline: "3-6months",
        description: "",
        preferredContact: "email",
        newsletter: false,
        termsAccepted: false
      },
      
      onSubmit: async ({ value, formApi }) => {
        try {
          // Show loading state
          formApi.setSubmitting(true);
          
          // Submit to API
          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value)
          });
          
          if (!response.ok) {
            throw new Error('Submission failed');
          }
          
          const result = await response.json();
          
          // Clear stored form data on success
          localStorage.removeItem('enterprise-contact-form');
          
          // Show success message
          toast.success('Thank you! We\'ll be in touch within 24 hours.');
          
          // Redirect to thank you page
          router.push('/thank-you');
          
        } catch (error) {
          console.error('Form submission error:', error);
          toast.error('Something went wrong. Please try again.');
        } finally {
          formApi.setSubmitting(false);
        }
      }
    },
    
    nextLabel: "Continue →",
    previousLabel: "← Back",
    submitLabel: "Submit Inquiry",
    formClassName: "max-w-2xl mx-auto"
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get Your Free Project Quote
          </h1>
          <p className="text-xl text-gray-600">
            Tell us about your project and we'll provide a detailed proposal within 24 hours
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Form />
        </div>
      </div>
    </div>
  );
}
```

## 🧠 AI-Powered Development with `.cursorrules`

This project includes a `.cursorrules.json` file to enhance development with AI code assistants like Cursor. This file provides the AI with context about the project, including:

-   **Core Concepts**: Key principles of the `formedible` library.
-   **Component Structure**: How to create and use field components.
-   **Project Guidelines**: General coding conventions and project structure.

This helps the AI generate more accurate and idiomatic code, speeding up development and ensuring consistency.

## 🚀 Migration from Other Form Libraries

### From React Hook Form

```tsx
// Before (React Hook Form)
const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: { name: "", email: "" }
});

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("name", { required: "Name is required" })} />
  {errors.name && <span>{errors.name.message}</span>}
  
  <input {...register("email", { required: "Email is required", pattern: /^\S+@\S+$/i })} />
  {errors.email && <span>{errors.email.message}</span>}
  
  <button type="submit">Submit</button>
</form>

// After (Formedible)
const { Form } = useFormedible({
  schema: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Email is required")
  }),
  fields: [
    { name: "name", type: "text", label: "Name" },
    { name: "email", type: "email", label: "Email" }
  ],
  formOptions: {
    defaultValues: { name: "", email: "" },
    onSubmit: async ({ value }) => onSubmit(value)
  }
});

return <Form />;
```

### From Formik

```tsx
// Before (Formik)
<Formik
  initialValues={{ name: "", email: "" }}
  validationSchema={yup.object({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required")
  })}
  onSubmit={handleSubmit}
>
  {({ errors, touched }) => (
    <FormikForm>
      <Field name="name" />
      {errors.name && touched.name && <div>{errors.name}</div>}
      
      <Field name="email" type="email" />
      {errors.email && touched.email && <div>{errors.email}</div>}
      
      <button type="submit">Submit</button>
    </FormikForm>
  )}
</Formik>

// After (Formedible)
const { Form } = useFormedible({
  schema: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email")
  }),
  fields: [
    { name: "name", type: "text", label: "Name" },
    { name: "email", type: "email", label: "Email" }
  ],
  formOptions: {
    defaultValues: { name: "", email: "" },
    onSubmit: async ({ value }) => handleSubmit(value)
  }
});

return <Form />;
```

## 🔧 Development & Contributing

### Project Structure
```
formedible/
├── packages/
│   └── formedible/           # Core library
│       ├── src/
│       │   ├── hooks/        # Main useFormedible hook
│       │   ├── components/   # Field components
│       │   └── lib/          # Types and utilities
│       └── package.json
├── apps/
│   └── web/                  # Demo & documentation site
└── scripts/                  # Build and sync scripts
```

### Building from Source

```bash
# Clone the repository
git clone https://github.com/DimitriGilbert/Formedible
cd Formedible

# Install dependencies
npm install

# Build the library
npm run build:pkg

# Run the demo site
npm run dev:web

# Run tests
npm run test:pkg

# Lint everything
npm run lint
```

### Development Workflow

1. **Make changes** in `packages/formedible/`
2. **Build the package**: `npm run build:pkg`
3. **Sync to web app**: `./scripts/sync-formedible`
4. **Test changes**: `npm run dev:web`

## 📊 Performance & Bundle Size

### Bundle Impact
- **Core library**: ~45KB gzipped (including TanStack Form)
- **Individual field components**: 2-8KB each
- **Tree-shakeable**: Only import components you use
- **Zero runtime dependencies**: Beyond React and TanStack Form

### Performance Optimizations
- **Subscription-based updates**: Only re-render when necessary
- **Memoized field rendering**: Prevents unnecessary re-renders
- **Lazy validation**: Debounced async validation
- **Efficient conditional rendering**: Smart show/hide logic

## 🆚 Comparison with Alternatives

| Feature | Formedible | React Hook Form | Formik | Final Form |
|---------|------------|-----------------|--------|------------|
| **TypeScript Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Built-in Components** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | ⭐ |
| **Multi-page Forms** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Async Validation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Bundle Size** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Learning Curve** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Form Analytics** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | ⭐ |
| **Form Persistence** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | ⭐ |

## 🛣️ Roadmap

### 2025 Q1
- [ ] **Form Builder UI** - Visual form builder component
- [ ] **Advanced Field Types** - Rich text editor, signature pad, barcode scanner
- [ ] **Form Templates** - Pre-built form templates for common use cases
- [ ] **Enhanced Analytics** - A/B testing and conversion optimization

### 2025 Q2
- [ ] **Server-Side Rendering** - Enhanced SSR support with hydration
- [ ] **Form Workflows** - Multi-step approval workflows
- [ ] **Integration Plugins** - Zapier, Webhooks, CRM integrations
- [ ] **Advanced Validation** - ML-powered validation suggestions

### 2025 Q3
- [ ] **Mobile Optimizations** - Enhanced mobile form experience
- [ ] **Accessibility Improvements** - WCAG 2.2 compliance
- [ ] **Performance Monitoring** - Built-in performance metrics
- [ ] **Form Versioning** - Schema evolution and migration tools

## 📝 Changelog

### v0.2.8 (Latest)
- **✨ Major**: Dynamic Text System - Template strings with {{fieldName}} syntax for all user-facing text
- **🎯 Added**: Dynamic text support for labels, descriptions, placeholders, page titles, section titles
- **⚡ Enhanced**: Function-based dynamic text for complex logic
- **🏗️ Improved**: Performance-optimized with TanStack Form subscriptions
- **📦 Updated**: All components support dynamic text with fallback to literal strings

### v0.2.7
- **🚀 Major**: Unified Field Wrapper System - All 22+ field types now use consistent BaseFieldWrapper
- **⚡ Enhanced**: Event handling moved to fieldApi.eventHandlers for better architecture
- **🎯 Added**: Enhanced event access (onFocus, onBlur, onChange, onKeyDown, onKeyUp) across all fields
- **🏗️ Improved**: Type-safe field registry and component system
- **🔧 Fixed**: ObjectField type safety issues and mockFieldApi bugs
- **📦 Updated**: Registry includes new BaseFieldWrapper and FieldRegistry components

### v0.2.6
- **✨ Added**: Dynamic options support for select, radio, multiSelect, and autocomplete fields
- **🐛 Fixed**: Field configuration panel now properly updates when selecting fields
- **🎨 Improved**: Better TypeScript configuration for shadcn/ui components
- **⚡ Enhanced**: Form builder auto-selection behavior when adding new fields
- **🔧 Updated**: TanStack Form integration with v1 best practices

### v0.2.5
- **✨ Added**: Advanced form analytics and user behavior tracking
- **🔒 Enhanced**: Form persistence with localStorage/sessionStorage support
- **🧠 Improved**: Cross-field validation with better error handling
- **📱 Fixed**: Mobile responsiveness for complex multi-page forms

### v0.2.0
- **🚀 Major**: Complete rewrite using TanStack Form v1
- **🎯 Added**: 20+ field types with comprehensive configurations
- **🏗️ Enhanced**: Advanced conditional logic and dynamic forms
- **📊 Added**: Built-in form analytics and persistence features

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

**Formedible** stands on the shoulders of giants:

- **[TanStack Form](https://tanstack.com/form)** - The most powerful form state management library for React
- **[Zod](https://zod.dev)** - TypeScript-first schema validation that just works
- **[shadcn/ui](https://ui.shadcn.com)** - Beautiful, accessible components that make forms look great
- **[React](https://react.dev)** - The foundation that makes it all possible
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety that prevents runtime errors

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute
- 🐛 **Report bugs** - Help us improve by reporting issues
- ✨ **Suggest features** - Share your ideas for new capabilities
- 📝 **Improve docs** - Help make our documentation better
- 🧪 **Write tests** - Increase our test coverage
- 💻 **Submit PRs** - Contribute code improvements

## 💬 Community & Support

- **GitHub Discussions** - Ask questions and share ideas
- **Discord Server** - Real-time community chat
- **Stack Overflow** - Tag your questions with `formedible`
- **Twitter** - Follow [@FormedibleForms](https://twitter.com/FormedibleForms) for updates

---

**Formedible** - Making form building in React a truly delightful experience. From simple contact forms to enterprise-grade multi-step wizards, we've got you covered. 🚀

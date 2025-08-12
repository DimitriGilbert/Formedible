Formedible Wrapper System Guide

Overview

Formedible provides a comprehensive wrapper system that allows you to customize the rendering
and behavior of fields, groups, sections, pages, and the entire form. This system is designed
for maximum flexibility while maintaining type safety and performance.

Wrapper Hierarchy

The wrapper system operates at multiple levels, each providing different customization
opportunities:

1. Form-level wrapper - Wraps the entire form
2. Page-level wrapper - Wraps individual pages in multi-page forms
3. Section-level wrapper - Wraps logical sections within pages
4. Group-level wrapper - Wraps field groups within sections
5. Field-level wrapper - Wraps individual fields

Field-Level Wrappers

Individual Field Wrapper

Each field can have its own custom wrapper specified in the field configuration:

```typescript
const fieldConfig: FieldConfig = {
  name: "username",
  type: "text",
  label: "Username",
  wrapper: ({ children, field }) => (
    <div className="custom-field-wrapper">
      <div className="field-header">
        <span className="field-type-badge">{field.type}</span>
      </div>
      {children}
      <div className="field-footer">
        <small>Field: {field.name}</small>
      </div>
    </div>
  ),
};
```

Global Field Wrapper

Apply a wrapper to all fields using the globalWrapper option:

```typescript
const { Form } = useFormedible({
  fields: myFields,
  globalWrapper: ({ children, field }) => (
    <div className="global-field-wrapper">
      <div className="field-meta">
        <span className="field-name">{field.name}</span>
        <span className="field-type">{field.type}</span>
      </div>
      {children}
    </div>
  ),
});
```

Built-in Field Wrappers

Formedible includes several built-in wrappers:

Basic Field Wrapper

```typescript
import { FieldWrapper } from "@/components/formedible/fields/base-field-wrapper";

// Automatically handles labels, descriptions, and error display
<FieldWrapper
  fieldApi={fieldApi}
  label="Field Label"
  description="Field description"
  showErrors={true}
>
  <YourFieldComponent />
</FieldWrapper>;
```

Inline Validation Wrapper

```typescript
  import { InlineValidationWrapper } from
  '@/components/formedible/fields/inline-validation-wrapper';

  // Provides real-time validation feedback with loading states
  <InlineValidationWrapper
    fieldApi={fieldApi}
    inlineValidation={{
      enabled: true,
      debounceMs: 300,
      showSuccess: true,
      asyncValidator: async (value) => {
        // Your async validation logic
        return value ? null : "This field is required";
      }
    }}
  >
    <YourFieldComponent />
  </InlineValidationWrapper>

  Group-Level Organization

  Fields can be organized into groups using the group property:

  const fields: FieldConfig[] = [
    {
      name: "firstName",
      type: "text",
      group: "personal-info"
    },
    {
      name: "lastName",
      type: "text",
      group: "personal-info"
    },
    {
      name: "email",
      type: "email",
      group: "contact-info"
    }
  ];
```

Groups are automatically rendered with styling and can be customized through CSS classes.

Section-Level Wrappers

Sections provide higher-level organization with titles, descriptions, and collapsible
functionality:

```typescript
const fieldWithSection: FieldConfig = {
  name: "profilePicture",
  type: "file",
  section: {
    title: "Profile Information",
    description: "Upload your profile details",
    collapsible: true,
    defaultExpanded: true,
  },
};
```

Section rendering is handled automatically by the SectionRenderer component, which:

- Renders section titles and descriptions
- Provides collapse/expand functionality
- Groups related fields together
- Handles conditional visibility

Page-Level Wrappers

For multi-page forms, you can customize page rendering:

```typescript
const CustomPageWrapper = ({
  children,
  title,
  description,
  page,
  totalPages,
}) => (
  <div className="custom-page">
    <header className="page-header">
      <h2>{title}</h2>
      <div className="page-progress">
        Page {page} of {totalPages}
      </div>
    </header>
    <div className="page-content">{children}</div>
  </div>
);

const pageConfig: PageConfig = {
  page: 1,
  title: "Personal Information",
  description: "Tell us about yourself",
  component: CustomPageWrapper,
};
```

Form-Level Customization

Custom Form Component

You can completely customize the form rendering by providing children to the Form component:

```typescript
<Form>
  <div className="custom-form-layout">
    <header>Custom Form Header</header>

    {/* Custom progress indicator */}
    <div className="progress-section">
      <progress value={progressValue} max={100} />
    </div>

    {/* Custom field rendering */}
    <div className="fields-section">
      {/* Your custom field rendering logic */}
    </div>

    {/* Custom navigation */}
    <div className="navigation-section">
      <button onClick={goToPreviousPage}>Previous</button>
      <button onClick={goToNextPage}>Next</button>
    </div>
  </div>
</Form>
```

Layout Components

Formedible provides layout components for organizing your form structure:

FormTabs

```typescript
import { FormTabs } from "@/components/formedible/layout/form-tabs";

const { Form } = useFormedible({
  fields: myFields,
  tabs: [
    { id: "personal", label: "Personal Info" },
    { id: "contact", label: "Contact Details" },
  ],
});
```

FormStepper

```typescript
import { FormStepper } from "@/components/formedible/layout/form-stepper";

<FormStepper
  steps={[
    { id: "step1", title: "Basic Info", content: <div>Step 1 content</div> },
    { id: "step2", title: "Details", content: <div>Step 2 content</div> },
  ]}
  currentStep={0}
  onStepChange={(step) => console.log("Step changed:", step)}
/>;
```

Conditional Rendering

Wrappers work seamlessly with conditional rendering:

```typescript
const conditionalField: FieldConfig = {
  name: "dependentField",
  type: "text",
  conditional: (values) => values.showDependentField === true,
  wrapper: ({ children, field }) => (
    <div className="conditional-wrapper">
      <div className="conditional-indicator">
        This field is conditionally shown
      </div>
      {children}
    </div>
  ),
};
```

Best Practices

1. Performance: Field wrappers are memoized to prevent unnecessary re-renders
2. Type Safety: All wrapper props are fully typed for better developer experience
3. Accessibility: Built-in wrappers handle ARIA attributes and accessibility concerns
4. Composition: Wrappers can be nested and composed for complex layouts
5. Reusability: Create reusable wrapper components for consistent styling across forms

Wrapper Props Reference

Field Wrapper Props

```typescript
interface FieldWrapperProps extends BaseFieldProps {
  children: React.ReactNode;
  htmlFor?: string;
  showErrors?: boolean;
}
```

Custom Wrapper Props

```typescript
interface CustomWrapperProps {
  children: React.ReactNode;
  field: FieldConfig;
}
```

This wrapper system provides complete control over your form's appearance and behavior while
maintaining the power and flexibility of the underlying Formedible architecture.

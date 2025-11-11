# Formedible Builder

> **Visual Form Builder** - A powerful drag-and-drop interface for creating Formedible forms without writing code.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)

The **Formedible Builder** is a comprehensive visual form builder that provides a GUI for creating sophisticated Formedible forms. It features drag-and-drop field management, live preview, comprehensive field configuration, and code generation - all in a beautiful, responsive interface.

## 🎯 Why Formedible Builder?

Building forms with code is powerful, but sometimes you want to:

- 🎨 **Visually Design** - See your form take shape in real-time
- ⚡ **Prototype Quickly** - Build forms faster than writing code
- 🔄 **Iterate Easily** - Drag, drop, and configure without context switching
- 📤 **Export Clean Code** - Get production-ready React/TypeScript code
- 👥 **Collaborate** - Share form designs with non-technical stakeholders

## ⚡ Key Features

### 🎨 **Visual Form Design**
- Drag-and-drop field management
- Visual field ordering and organization
- Real-time form preview
- Responsive design testing

### ⚙️ **Comprehensive Field Configuration**
- Support for all 24+ Formedible field types
- Complete configuration options for each field type
- Array and object field nesting
- Conditional field visibility
- Dynamic options configuration

### 🔍 **Live Preview**
- Real-time form rendering
- Test form interactions
- Validate field configurations
- Preview multi-page forms

### 💻 **Code Generation**
- Export as React/TypeScript code
- Generates valid `useFormedible` configurations
- Includes all field configurations
- Copy-paste ready code

### 📊 **Multi-Page Forms**
- Visual page organization
- Page-level field assignment
- Progress indicator configuration
- Page navigation setup

### 📂 **Import/Export**
- Save form configurations as JSON
- Load and edit existing forms
- Share form designs
- Version control friendly

### 📱 **Responsive Design**
- Works on desktop, tablet, and mobile
- Touch-friendly interface
- Adaptive layouts
- Mobile form preview

## 📦 Installation

### Via shadcn CLI (Recommended)

```bash
npx shadcn@latest add https://formedible.dev/r/form-builder.json
```

This installs:
- FormBuilder component
- FieldConfigurator component
- FormPreview component
- All required dependencies

### Via npm

```bash
npm install formedible-builder
# Also install peer dependencies
npm install formedible react react-dom zod @tanstack/react-form
```

## 🏃‍♂️ Quick Start

### Basic Usage

```tsx
import { FormBuilder } from '@/components/formedible/builder/form-builder';

export default function BuilderPage() {
  return (
    <div className="container mx-auto p-4">
      <FormBuilder />
    </div>
  );
}
```

### With Custom Configuration

```tsx
import { FormBuilder } from '@/components/formedible/builder/form-builder';

export default function BuilderPage() {
  const handleSave = (config: UseFormedibleOptions) => {
    console.log('Form configuration:', config);
    // Save to database, export, etc.
  };

  return (
    <div className="container mx-auto p-4">
      <FormBuilder
        onSave={handleSave}
        initialConfig={existingFormConfig}
      />
    </div>
  );
}
```

## 🎨 Supported Field Types

The builder supports all Formedible field types:

### Basic Input Fields
- **Text** - text, email, password, url, tel
- **Textarea** - Multi-line text with configuration
- **Number** - Number input with min/max/step

### Selection Fields
- **Select** - Dropdown selection
- **Combobox** - Searchable dropdown
- **Multi-Select** - Multiple selection
- **Radio** - Radio button groups
- **Checkbox** - Boolean checkbox
- **Switch** - Toggle switch

### Advanced Fields
- **Date** - Date picker with restrictions
- **Slider** - Range slider with visualizations
- **Rating** - Star/heart/thumb rating
- **Phone** - International phone input
- **Color Picker** - Color selection
- **File Upload** - File upload with drag-and-drop

### Complex Fields
- **Array** - Dynamic arrays with sorting
- **Object** - Nested object fields
- **Autocomplete** - Text with suggestions
- **Location** - Map-based location picker
- **Duration** - Time duration input
- **Masked Input** - Formatted text input

## 🔧 Components

### FormBuilder

The main builder component with complete interface.

```tsx
interface FormBuilderProps {
  initialConfig?: UseFormedibleOptions;
  onSave?: (config: UseFormedibleOptions) => void;
  onExport?: (config: UseFormedibleOptions) => void;
  className?: string;
}
```

**Features:**
- Field list with drag-and-drop
- Field configurator panel
- Live preview
- Code generation
- Import/Export

### FieldConfigurator

Standalone field configuration component.

```tsx
interface FieldConfiguratorProps {
  field: FieldConfig;
  onChange: (field: FieldConfig) => void;
  onClose: () => void;
}
```

**Features:**
- Field type selection
- Property configuration
- Validation rules
- Advanced options

### FormPreview

Live form preview component.

```tsx
interface FormPreviewProps {
  config: UseFormedibleOptions;
  className?: string;
}
```

**Features:**
- Real-time rendering
- Interactive testing
- Validation preview
- Multi-page navigation

## 🎯 Building Forms

### Step 1: Add Fields

Click "Add Field" and select from 24+ field types. Fields appear in the left panel.

### Step 2: Configure Fields

Click any field to open the configurator. Set:
- Field name and label
- Validation rules
- Field-specific options
- Display properties

### Step 3: Organize

- Drag fields to reorder
- Assign fields to pages
- Group related fields
- Set conditional visibility

### Step 4: Preview

Switch to the Preview tab to:
- Test form interactions
- Validate configurations
- Check multi-page flow
- Test on different screen sizes

### Step 5: Export

Click "Generate Code" to:
- View generated React code
- Copy to clipboard
- Export as JSON
- Save configuration

## 💻 Code Generation

The builder generates clean, production-ready code:

```tsx
// Generated code example
const contactForm = useFormedible({
  schema: z.object({
    name: z.string().min(2, "Name required"),
    email: z.string().email("Valid email required"),
    message: z.string().min(10, "Message too short"),
  }),
  fields: [
    {
      name: "name",
      type: "text",
      label: "Full Name",
      placeholder: "Enter your name",
      page: 1
    },
    {
      name: "email",
      type: "email",
      label: "Email Address",
      placeholder: "your@email.com",
      page: 1
    },
    {
      name: "message",
      type: "textarea",
      label: "Message",
      placeholder: "Your message...",
      textareaConfig: {
        rows: 4,
        maxLength: 500
      },
      page: 2
    }
  ],
  pages: [
    { page: 1, title: "Contact Info" },
    { page: 2, title: "Your Message" }
  ],
  formOptions: {
    defaultValues: {
      name: "",
      email: "",
      message: ""
    },
    onSubmit: async ({ value }) => {
      console.log("Form submitted:", value);
    }
  }
});

return <contactForm.Form />;
```

## 🏗️ Architecture

### State Management

Uses Zustand for efficient state management:
- Field store for field list
- Configuration store for form settings
- UI store for builder state

### Performance

Optimized for smooth interaction:
- Lazy loading for heavy components
- Memoized renders
- Efficient drag-and-drop
- Debounced updates

## 📖 Documentation

For complete documentation:

- [Getting Started](https://formedible.dev/docs/getting-started)
- [Builder Documentation](https://formedible.dev/docs/builder)
- [Field Types](https://formedible.dev/docs/fields)
- [Examples](https://formedible.dev/docs/examples)

## 🔗 Related Packages

- [@formedible/core](../formedible) - Core form library
- [@formedible/ai-builder](../ai-builder) - AI-powered form generation
- [@formedible/parser](../formedible-parser) - Form definition parser

## 🤝 Contributing

This is part of a monorepo. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes in `packages/builder/`
4. Run tests: `npm run test`
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🙏 Acknowledgments

Built for the Formedible ecosystem:
- [Formedible](../formedible) - The core form library
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [dnd-kit](https://dndkit.com/) - Drag and drop

---

**Formedible Builder** - Visual form building made easy. 🎨
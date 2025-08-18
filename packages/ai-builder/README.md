# Formedible Builder

A visual form builder component for creating forms with a drag-and-drop interface. Built on top of the Formedible library.

## Installation

### Using shadcn CLI (Recommended)

```bash
npx shadcn@latest add https://raw.githubusercontent.com/DimitriGilbert/Formedible/main/packages/builder/registry.json form-builder
```

### Using npm

```bash
npm install formedible-builder
```

## Usage

```tsx
import { FormBuilder } from 'formedible-builder';

export default function App() {
  return (
    <div className="container mx-auto p-4">
      <FormBuilder />
    </div>
  );
}
```

## Features

- **Visual Form Builder**: Drag and drop interface for creating forms
- **Live Preview**: See your form in real-time as you build it
- **Code Generation**: Export your form as ready-to-use React code
- **Field Configuration**: Comprehensive field configuration options
- **Multi-page Forms**: Support for multi-step forms
- **Import/Export**: Save and load form configurations
- **Responsive Design**: Works on desktop, tablet, and mobile

## Components

### FormBuilder

The main form builder component with a complete interface for creating forms.

### FieldConfigurator

A component for configuring individual form fields with all available options.

### FormPreview

A component that renders a live preview of the form being built.

## Dependencies

This package requires the following peer dependencies:

- `formedible` - The core form library
- `react` - React framework
- `react-dom` - React DOM
- `zod` - Schema validation
- `@tanstack/react-form` - Form state management

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build package
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## License

MIT
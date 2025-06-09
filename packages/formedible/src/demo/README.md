# Formedible Registry Homepage

This React application serves as the homepage for the Formedible registry, providing:

1. **Registry Homepage**: Beautiful landing page for the shadcn/ui registry
2. **Interactive Demo**: Live showcase of all Formedible features with working examples
3. **Installation Guide**: Clear instructions for getting started

## Features Demonstrated

- **Contact Form**: Simple form with validation
- **User Profile**: Complex form with multiple field types (text, email, number, select, textarea, switch, checkbox, date)
- **Survey Form**: Rating and feedback form

## Field Types Showcased

- ✅ Text fields (text, email, password, url)
- ✅ Textarea
- ✅ Number input
- ✅ Select dropdown
- ✅ Checkbox
- ✅ Switch
- ✅ Date picker

## Running the Homepage

### Development
```bash
npm run dev:homepage
```
This starts the development server. Use `VITE_PORT=8080` or `PORT=8080` to set a custom port.

### Build for Production
```bash
npm run build:homepage
```
This builds the homepage into the `public/` directory, making it the registry homepage.

### Serve Registry
```bash
npm run dev:registry
```
This serves the built registry on port 42357 (or `REGISTRY_PORT` env var).

## Tech Stack

- **React 19**: Latest React with modern features
- **Vite**: Fast development and build tool
- **Tailwind CSS v4**: Latest styling framework
- **shadcn/ui**: Beautiful component library
- **Lucide React**: Icon library
- **TanStack Form**: Powerful form management
- **Zod**: Schema validation

## Purpose

This homepage serves multiple critical functions:

1. **Registry Homepage**: Professional landing page for the shadcn/ui registry
2. **Live Demo**: Interactive examples showing all field types and features
3. **Installation Guide**: Clear instructions with dynamic registry URLs
4. **Testing Environment**: Validate all components work correctly
5. **Documentation**: Visual examples of usage patterns

When built, this becomes the main `public/index.html` for the registry, providing users with an immediate way to see Formedible in action and get installation instructions before using the components. 
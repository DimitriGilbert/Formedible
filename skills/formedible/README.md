# Formedible Skill - Installation Complete

The Formedible skill has been successfully created and is ready to use.

## Skill Structure

```
formedible/
├── SKILL.md                    # Main skill instructions
├── README.md                   # This file
├── references/
│   ├── FIELD_TEMPLATES.md      # Templates for creating new field types
│   ├── COMMON_PATTERNS.md      # Reusable form patterns
│   └── DEBUGGING.md            # Troubleshooting guide
└── templates/
    ├── form-template.tsx       # Quick-start form template
    └── multi-page-form-template.tsx  # Multi-page wizard template
```

## What This Skill Provides

### Core Knowledge (SKILL.md)
- Quick reference for all 22 field types
- Dynamic options and dynamic text patterns
- Conditional rendering and cross-field validation
- Multi-page forms, tabs, and analytics
- Architecture patterns and best practices
- Critical workflow rules for development
- Type safety guidelines

### Field Templates (references/FIELD_TEMPLATES.md)
- Basic field template
- Selection field template
- Boolean field template
- Complex field template
- Integration steps for adding new fields

### Common Patterns (references/COMMON_PATTERNS.md)
- Dependent fields (country/state selection)
- Password confirmation
- Date range validation
- Terms and conditions
- Dynamic field arrays
- Search with debounce
- Auto-save forms
- Multi-page wizards
- Conditional sections
- Analytics tracking
- Nested objects
- Tabbed forms
- Custom ratings
- File uploads
- Slider with value mapping

### Debugging Guide (references/DEBUGGING.md)
- Common issues and solutions
- Diagnostics commands
- Debug mode setup
- Performance debugging
- Browser console commands

### Quick Templates (templates/)
- Basic form scaffold
- Multi-page wizard scaffold

## When to Use This Skill

Invoke this skill when:
- Creating new Formedible forms
- Adding custom field types to Formedible
- Debugging form issues
- Implementing conditional logic or dynamic options
- Setting up multi-page forms or analytics
- Working with form persistence

## Usage

The skill will be automatically available when working on Formedible-related tasks. It provides context-aware guidance based on your specific task.

## Key Principles Embedded

1. **Packages are source of truth** - Never edit web app files directly
2. **Always use BaseFieldWrapper** - For consistent field behavior
3. **Type safety first** - Always infer types from Zod schemas
4. **Analytics-aware** - Use eventHandlers for tracking
5. **Performance optimized** - Use TanStack Form selectors

## Development Workflow Reminder

```bash
# Work in packages first
# Edit: packages/formedible/src/...

# Then sync
npm run build:pkg
node scripts/quick-sync.js
npm run build:web
npm run sync-components
```

---

Created with expertise from Formedible codebase analysis.

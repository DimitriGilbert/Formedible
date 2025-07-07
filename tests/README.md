# Formedible E2E Tests

This directory contains comprehensive end-to-end tests for the Formedible library using Puppeteer. The tests validate all major functionality of the form library through real browser interactions.

## Test Structure

### Test Files

- **`contact-form.test.ts`** - Tests basic form functionality, validation, and field interactions
- **`registration-form.test.ts`** - Tests multi-step forms, progress tracking, and navigation
- **`survey-form.test.ts`** - Tests conditional fields, dynamic behavior, and complex logic
- **`checkout-form.test.ts`** - Tests complex multi-page workflows and payment flows
- **`job-application-form.test.ts`** - Tests advanced field types and comprehensive validation

### Utilities

- **`utils/form-helpers.ts`** - Reusable helper functions for form interactions
- **`setup.ts`** - Test environment setup and teardown

## Test Coverage

### Core Features Tested

#### 1. Basic Form Functionality
- Form field rendering
- Input field interactions (text, email, textarea)
- Select dropdown functionality
- Checkbox and radio button interactions
- Form submission and success handling

#### 2. Form Validation
- Required field validation
- Email format validation
- Minimum/maximum length validation
- Custom validation rules
- Real-time validation feedback
- Error message display

#### 3. Multi-Step Forms
- Step navigation (next/previous)
- Progress tracking and indicators
- Step validation
- Data persistence between steps
- Progress percentage calculation

#### 4. Conditional Fields
- Field visibility based on other field values
- Nested conditional logic
- Dynamic field requirements
- Conditional validation rules
- Complex dependency chains

#### 5. Advanced Field Types
- Multi-select with search functionality
- Rating fields
- Date and time pickers
- Phone number fields
- Number fields with step validation
- File upload fields
- Slider components

#### 6. Complex Workflows
- E-commerce checkout flows
- Job application processes
- Survey forms with branching logic
- Registration workflows
- Payment method selection

### Field Types Covered

| Field Type | Test Coverage | Features Tested |
|------------|---------------|-----------------|
| Text Input | ✅ Complete | Validation, placeholder, required |
| Email Input | ✅ Complete | Format validation, required |
| Textarea | ✅ Complete | Min length, placeholder, required |
| Select Dropdown | ✅ Complete | Options, default values, validation |
| Multi-Select | ✅ Complete | Multiple selections, max limits, search |
| Checkbox | ✅ Complete | Toggle functionality, default state |
| Radio Buttons | ✅ Complete | Single selection, validation |
| Switch | ✅ Complete | Toggle state, default values |
| Date Picker | ✅ Complete | Date selection, validation |
| Phone Field | ✅ Complete | Format validation, international support |
| Number Field | ✅ Complete | Min/max values, step validation |
| Rating Field | ✅ Complete | Star ratings, value selection |
| File Upload | ✅ Partial | File selection (upload testing limited) |

## Running Tests

### Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev:web
   ```
   The web app should be running on `http://localhost:3001`

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:e2e:watch

# Run tests with coverage
npm run test:e2e:coverage

# Run specific test file
npx jest tests/contact-form.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="validation"
```

### Test Configuration

The tests are configured in `jest.config.js`:

- **Test Environment:** Node.js with Puppeteer
- **Test Timeout:** 30 seconds per test
- **Browser:** Headless Chrome
- **Viewport:** 1280x720

## Test Scenarios

### Contact Form Tests
- ✅ Basic form rendering
- ✅ Form submission with valid data
- ✅ Validation error handling
- ✅ Field interaction testing
- ✅ Form state persistence

### Registration Form Tests
- ✅ Multi-step navigation
- ✅ Progress tracking
- ✅ Step validation
- ✅ Data persistence between steps
- ✅ Complete registration flow

### Survey Form Tests
- ✅ Conditional field display/hide
- ✅ Nested conditional logic
- ✅ Dynamic validation rules
- ✅ Multi-select with limits
- ✅ Rating field interactions

### Checkout Form Tests
- ✅ Multi-page checkout flow
- ✅ Payment method selection
- ✅ Conditional payment fields
- ✅ Shipping options
- ✅ Form data persistence
- ✅ Complete purchase flow

### Job Application Tests
- ✅ Advanced field types
- ✅ Skills multi-select with search
- ✅ Date and number field validation
- ✅ Required vs optional fields
- ✅ Complete application submission

## Best Practices

### Test Organization
- Each form type has its own test file
- Tests are grouped by functionality
- Helper functions are reused across tests
- Clear test descriptions and assertions

### Test Data
- Use realistic test data
- Test both valid and invalid inputs
- Cover edge cases and boundary conditions
- Test with various data types and formats

### Assertions
- Verify form rendering
- Check field interactions
- Validate error messages
- Confirm successful submissions
- Test state persistence

### Error Handling
- Test validation error display
- Verify error message content
- Check error clearing behavior
- Test form recovery scenarios

## Troubleshooting

### Common Issues

1. **Tests timing out:**
   - Increase timeout in jest.config.js
   - Check if dev server is running
   - Verify network connectivity

2. **Element not found errors:**
   - Check selector accuracy
   - Verify element visibility
   - Add appropriate wait conditions

3. **Form submission failures:**
   - Verify all required fields are filled
   - Check validation rules
   - Ensure proper form state

### Debug Mode

To run tests in non-headless mode for debugging:

```javascript
// In setup.ts, change:
global.browser = await puppeteer.launch({
  headless: false, // Set to false for debugging
  slowMo: 100,     // Slow down actions
});
```

## Contributing

When adding new tests:

1. Follow existing naming conventions
2. Use the helper functions in `utils/form-helpers.ts`
3. Add appropriate test descriptions
4. Cover both positive and negative scenarios
5. Update this documentation

## Test Results

The tests validate that Formedible provides:

- ✅ Robust form validation
- ✅ Smooth multi-step navigation
- ✅ Reliable conditional field logic
- ✅ Comprehensive field type support
- ✅ Excellent user experience
- ✅ Consistent behavior across different form types
- ✅ Proper error handling and recovery
- ✅ Data persistence and state management

These tests ensure that Formedible is production-ready and provides a reliable foundation for building complex forms in React applications.
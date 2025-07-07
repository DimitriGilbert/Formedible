import { FormTestHelpers } from './utils/form-helpers';

describe('Fast Contact Form Test', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
  });

  test('should quickly fill and submit contact form', async () => {
    await helpers.navigateToExamples();
    await helpers.switchToTab('contact');
    
    // Fill form fields rapidly
    await helpers.fillInput('input[name="name"]', 'John Doe');
    await helpers.fillInput('input[name="email"]', 'john@example.com');
    
    // Select subject option
    await helpers.selectOption('select[name="subject"]', 'support');
    
    // Fill message
    await helpers.fillInput('textarea[name="message"]', 'This is a test message for support.');
    
    // Click checkbox
    await helpers.clickCheckbox('input[type="checkbox"]');
    
    // Submit form
    await helpers.submitForm();
    
    // Verify success
    const toastAppeared = await helpers.waitForToast();
    expect(toastAppeared).toBe(true);
    
    const toastMessage = await helpers.getToastMessage();
    expect(toastMessage).toContain('Message sent successfully');
  });

  test('should validate required fields quickly', async () => {
    await helpers.navigateToExamples();
    await helpers.switchToTab('contact');
    
    // Try to submit empty form
    await helpers.submitForm();
    
    // Check for validation errors (these should appear quickly)
    const nameError = await helpers.getValidationError('name');
    const emailError = await helpers.getValidationError('email');
    const messageError = await helpers.getValidationError('message');
    
    expect(nameError || emailError || messageError).toBeTruthy();
  });
});
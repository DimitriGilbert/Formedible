import { FormTestHelpers } from './utils/form-helpers';

describe('Contact Form Tests', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
    await helpers.navigateToExamples();
    // Contact tab is already active by default, no need to switch
  });

  describe('Basic Form Functionality', () => {
    test('should render all form fields', async () => {
      // Check if all required fields are present using proper Radix UI selectors
      await global.page.waitForSelector('[data-slot="input"][name="name"]', { timeout: 3000 });
      await global.page.waitForSelector('[data-slot="input"][name="email"]', { timeout: 3000 });
      await global.page.waitForSelector('[data-slot="select-trigger"]', { timeout: 3000 });
      await global.page.waitForSelector('textarea[name="message"]', { timeout: 3000 });
      await global.page.waitForSelector('[data-slot="checkbox"]', { timeout: 3000 });
      await global.page.waitForSelector('button[type="submit"]', { timeout: 3000 });
    });

    test('should fill and submit form successfully', async () => {
      // Fill out the form
      await helpers.fillInput('input[name="name"]', 'John Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.selectOption('select[name="subject"]', 'support');
      await helpers.fillInput('textarea[name="message"]', 'This is a test message for support.');
      await helpers.clickCheckbox('input[name="urgent"]');

      // Submit the form
      await helpers.submitForm();

      // Check for success toast
      const toastAppeared = await helpers.waitForToast();
      expect(toastAppeared).toBe(true);

      const toastMessage = await helpers.getToastMessage();
      expect(toastMessage).toContain('Message sent successfully');
    });
  });

  describe('Form Validation', () => {
    test('should show validation errors for empty required fields', async () => {
      // Try to submit empty form
      await helpers.submitForm();

      // Check for validation errors
      const nameError = await helpers.getValidationError('name');
      const emailError = await helpers.getValidationError('email');
      const messageError = await helpers.getValidationError('message');

      expect(nameError).toContain('Name must be at least 2 characters');
      expect(emailError).toContain('Please enter a valid email');
      expect(messageError).toContain('Message must be at least 10 characters');
    });

    test('should validate minimum name length', async () => {
      await helpers.fillInput('input[name="name"]', 'J');
      await helpers.submitForm();

      const nameError = await helpers.getValidationError('name');
      expect(nameError).toContain('Name must be at least 2 characters');
    });

    test('should validate email format', async () => {
      await helpers.fillInput('input[name="email"]', 'invalid-email');
      await helpers.submitForm();

      const emailError = await helpers.getValidationError('email');
      expect(emailError).toContain('Please enter a valid email');
    });

    test('should validate message minimum length', async () => {
      await helpers.fillInput('textarea[name="message"]', 'Short');
      await helpers.submitForm();

      const messageError = await helpers.getValidationError('message');
      expect(messageError).toContain('Message must be at least 10 characters');
    });

    test('should accept valid form data', async () => {
      await helpers.fillInput('input[name="name"]', 'John Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('textarea[name="message"]', 'This is a valid message with enough characters.');

      await helpers.submitForm();

      // Should not show validation errors
      const nameError = await helpers.getValidationError('name');
      const emailError = await helpers.getValidationError('email');
      const messageError = await helpers.getValidationError('message');

      expect(nameError).toBeNull();
      expect(emailError).toBeNull();
      expect(messageError).toBeNull();

      // Should show success toast
      const toastAppeared = await helpers.waitForToast();
      expect(toastAppeared).toBe(true);
    });
  });

  describe('Field Interactions', () => {
    test('should handle select dropdown', async () => {
      await helpers.selectOption('select[name="subject"]', 'sales');
      
      // For native select, check the value directly
      try {
        const selectedValue = await global.page.$eval('select[name="subject"]', (el: any) => el.value);
        expect(selectedValue).toBe('sales');
      } catch {
        // For Radix select, check the trigger text or hidden input
        const triggerText = await global.page.$eval('[role="combobox"]', (el: any) => el.textContent?.trim());
        expect(triggerText).toContain('Sales');
      }
    });

    test('should handle checkbox toggle', async () => {
      // Initially unchecked
      let isChecked = await global.page.$eval('input[name="urgent"]', (el: any) => el.checked);
      expect(isChecked).toBe(false);

      // Click to check
      await helpers.clickCheckbox('input[name="urgent"]');
      isChecked = await global.page.$eval('input[name="urgent"]', (el: any) => el.checked);
      expect(isChecked).toBe(true);

      // Click to uncheck
      await helpers.clickCheckbox('input[name="urgent"]');
      isChecked = await global.page.$eval('input[name="urgent"]', (el: any) => el.checked);
      expect(isChecked).toBe(false);
    });

    test('should handle textarea input', async () => {
      const testMessage = 'This is a test message for the textarea field.';
      await helpers.fillInput('textarea[name="message"]', testMessage);
      
      const textareaValue = await global.page.$eval('textarea[name="message"]', (el: any) => el.value);
      expect(textareaValue).toBe(testMessage);
    });
  });

  describe('Form Reset and State', () => {
    test('should maintain form state during interaction', async () => {
      // Fill form partially
      await helpers.fillInput('input[name="name"]', 'John Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      
      // Switch to another tab and back
      await helpers.switchToTab('registration');
      await helpers.switchToTab('contact');
      
      // Check if values are maintained
      const nameValue = await global.page.$eval('input[name="name"]', (el: any) => el.value);
      const emailValue = await global.page.$eval('input[name="email"]', (el: any) => el.value);
      
      expect(nameValue).toBe('John Doe');
      expect(emailValue).toBe('john@example.com');
    });
  });
});
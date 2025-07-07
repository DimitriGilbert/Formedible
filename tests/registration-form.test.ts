import { FormTestHelpers } from './utils/form-helpers';

describe('Registration Form Tests', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
    await helpers.navigateToExamples();
    await helpers.switchToTab('registration');
  });

  describe('Multi-Step Navigation', () => {
    test('should render first step initially', async () => {
      // Check if first step fields are visible
      await global.page.waitForSelector('input[name="firstName"]');
      await global.page.waitForSelector('input[name="lastName"]');
      await global.page.waitForSelector('input[name="birthDate"]');
      
      // Check if next step fields are not visible
      const emailField = await helpers.isFieldVisible('input[name="email"]');
      expect(emailField).toBe(false);
    });

    test('should navigate through all steps', async () => {
      // Step 1: Personal Information
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      
      // Navigate to step 2
      await helpers.clickNextStep();
      
      // Check step 2 fields are visible
      await global.page.waitForSelector('input[name="email"]');
      await global.page.waitForSelector('input[name="phone"]');
      await global.page.waitForSelector('textarea[name="address"]');
      
      // Fill step 2
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.fillInput('textarea[name="address"]', '123 Main St, City, State 12345');
      
      // Navigate to step 3
      await helpers.clickNextStep();
      
      // Check step 3 fields are visible
      await global.page.waitForSelector('input[name="newsletter"]');
      await global.page.waitForSelector('input[name="notifications"]');
      await global.page.waitForSelector('input[value="basic"]');
    });

    test('should allow navigation back to previous steps', async () => {
      // Navigate to step 2
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.clickNextStep();
      
      // Navigate to step 3
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.fillInput('textarea[name="address"]', '123 Main St');
      await helpers.clickNextStep();
      
      // Go back to step 2
      await helpers.clickPreviousStep();
      
      // Check if step 2 fields are visible and values preserved
      await global.page.waitForSelector('input[name="email"]');
      const emailValue = await global.page.$eval('input[name="email"]', (el: any) => el.value);
      expect(emailValue).toBe('john@example.com');
    });
  });

  describe('Progress Tracking', () => {
    test('should show progress steps', async () => {
      // Check if progress indicators are present
      const progressSteps = await global.page.$$('[data-step]');
      expect(progressSteps.length).toBeGreaterThan(0);
    });

    test('should show progress percentage', async () => {
      const progressPercentage = await helpers.getProgressPercentage();
      expect(progressPercentage).toBeDefined();
      
      // Navigate to next step and check progress increases
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.clickNextStep();
      
      const newProgressPercentage = await helpers.getProgressPercentage();
      expect(parseInt(newProgressPercentage || '0')).toBeGreaterThan(parseInt(progressPercentage || '0'));
    });
  });

  describe('Field Types and Validation', () => {
    test('should validate required fields on each step', async () => {
      // Try to proceed without filling required fields
      await helpers.clickNextStep();
      
      // Should show validation errors
      const firstNameError = await helpers.getValidationError('firstName');
      const lastNameError = await helpers.getValidationError('lastName');
      
      expect(firstNameError).toContain('First name is required');
      expect(lastNameError).toContain('Last name is required');
    });

    test('should handle date field', async () => {
      const dateInput = await global.page.$('input[name="birthDate"]');
      expect(dateInput).toBeTruthy();
      
      // Test date input functionality
      await helpers.fillInput('input[name="birthDate"]', '1990-01-01');
      const dateValue = await global.page.$eval('input[name="birthDate"]', (el: any) => el.value);
      expect(dateValue).toBeTruthy();
    });

    test('should handle phone field validation', async () => {
      // Navigate to step 2
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.clickNextStep();
      
      // Try invalid phone
      await helpers.fillInput('input[name="phone"]', '123');
      await helpers.clickNextStep();
      
      const phoneError = await helpers.getValidationError('phone');
      expect(phoneError).toContain('Phone number required');
    });

    test('should handle switch fields', async () => {
      // Navigate to step 3
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.clickNextStep();
      
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.fillInput('textarea[name="address"]', '123 Main St');
      await helpers.clickNextStep();
      
      // Test switch toggles
      const newsletterSwitch = await global.page.$('input[name="newsletter"]');
      const notificationsSwitch = await global.page.$('input[name="notifications"]');
      
      expect(newsletterSwitch).toBeTruthy();
      expect(notificationsSwitch).toBeTruthy();
      
      // Test switch functionality
      await helpers.clickCheckbox('input[name="newsletter"]');
      const isNewsletterChecked = await global.page.$eval('input[name="newsletter"]', (el: any) => el.checked);
      expect(typeof isNewsletterChecked).toBe('boolean');
    });

    test('should handle radio button selection', async () => {
      // Navigate to step 3
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.clickNextStep();
      
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.fillInput('textarea[name="address"]', '123 Main St');
      await helpers.clickNextStep();
      
      // Test radio button selection
      await helpers.clickRadio('pro');
      const selectedPlan = await global.page.$eval('input[name="plan"]:checked', (el: any) => el.value);
      expect(selectedPlan).toBe('pro');
    });
  });

  describe('Complete Registration Flow', () => {
    test('should complete full registration successfully', async () => {
      // Step 1
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.clickNextStep();
      
      // Step 2
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.fillInput('textarea[name="address"]', '123 Main St, City, State 12345');
      await helpers.clickNextStep();
      
      // Step 3
      await helpers.clickCheckbox('input[name="newsletter"]');
      await helpers.clickRadio('pro');
      
      // Submit form
      await helpers.submitForm();
      
      // Check for success toast
      const toastAppeared = await helpers.waitForToast();
      expect(toastAppeared).toBe(true);
      
      const toastMessage = await helpers.getToastMessage();
      expect(toastMessage).toContain('Registration completed');
    });
  });
});
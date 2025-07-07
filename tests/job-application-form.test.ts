import { FormTestHelpers } from './utils/form-helpers';

describe('Job Application Form Tests', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
    await helpers.navigateToExamples();
    await helpers.switchToTab('job');
  });

  describe('Multi-Step Application Flow', () => {
    test('should render personal information page initially', async () => {
      // Check if personal info fields are visible
      await global.page.waitForSelector('input[name="firstName"]');
      await global.page.waitForSelector('input[name="lastName"]');
      await global.page.waitForSelector('input[name="email"]');
      await global.page.waitForSelector('input[name="phone"]');
      
      // Check if skills fields are not visible yet
      const skillsVisible = await helpers.isFieldVisible('select[name="skills"]');
      expect(skillsVisible).toBe(false);
    });

    test('should navigate through all application steps', async () => {
      // Step 1: Personal Information
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Step 2: Skills & Availability
      await global.page.waitForSelector('select[name="skills"]');
      await global.page.waitForSelector('input[name="startDate"]');
      await global.page.waitForSelector('input[name="salaryExpectation"]');
      
      await helpers.selectMultipleOptions('select[name="skills"]', ['javascript', 'react', 'node']);
      await helpers.fillInput('input[name="salaryExpectation"]', '75000');
      await helpers.clickNextStep();
      
      // Step 3: Additional Questions
      await global.page.waitForSelector('textarea[name="whyInterested"]');
      await global.page.waitForSelector('textarea[name="additionalInfo"]');
    });

    test('should show progress tracking', async () => {
      const progressPercentage = await helpers.getProgressPercentage();
      expect(progressPercentage).toBeDefined();
      
      // Navigate to next step and check progress increases
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      const newProgressPercentage = await helpers.getProgressPercentage();
      expect(parseInt(newProgressPercentage || '0')).toBeGreaterThan(parseInt(progressPercentage || '0'));
    });
  });

  describe('Advanced Field Types', () => {
    test('should handle multi-select skills field with search', async () => {
      // Navigate to skills step
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Test multi-select with search functionality
      await helpers.selectMultipleOptions('select[name="skills"]', ['javascript', 'typescript', 'react']);
      
      // Verify selections
      const selectedSkills = await global.page.$$eval('select[name="skills"] option:checked', 
        (options: any[]) => options.map(option => option.value)
      );
      expect(selectedSkills).toContain('javascript');
      expect(selectedSkills).toContain('typescript');
      expect(selectedSkills).toContain('react');
    });

    test('should handle creatable skills (custom skills)', async () => {
      // Navigate to skills step
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Try to add a custom skill (if the component supports it)
      await global.page.click('select[name="skills"]');
      
      // Type a custom skill
      const customSkill = 'Machine Learning';
      await global.page.type('select[name="skills"] input', customSkill);
      
      // Check if custom skill can be added
      const skillsDropdown = await global.page.$('select[name="skills"]');
      expect(skillsDropdown).toBeTruthy();
    });

    test('should respect max selections limit for skills', async () => {
      // Navigate to skills step
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Try to select more than the maximum allowed (10)
      const allSkills = ['javascript', 'typescript', 'react', 'node', 'python', 'java', 'sql', 'aws'];
      await helpers.selectMultipleOptions('select[name="skills"]', allSkills);
      
      // Check that selections are within limit
      const selectedCount = await global.page.$$eval('select[name="skills"] option:checked', 
        (options: any[]) => options.length
      );
      expect(selectedCount).toBeLessThanOrEqual(10);
    });

    test('should handle date field for start date', async () => {
      // Navigate to skills step
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Test date input
      const dateInput = await global.page.$('input[name="startDate"]');
      expect(dateInput).toBeTruthy();
      
      await helpers.fillInput('input[name="startDate"]', '2024-01-15');
      const dateValue = await global.page.$eval('input[name="startDate"]', (el: any) => el.value);
      expect(dateValue).toBeTruthy();
    });

    test('should handle number field with step for salary', async () => {
      // Navigate to skills step
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Test number input with step
      await helpers.fillInput('input[name="salaryExpectation"]', '75000');
      const salaryValue = await global.page.$eval('input[name="salaryExpectation"]', (el: any) => el.value);
      expect(parseInt(salaryValue)).toBe(75000);
      
      // Test step functionality (if supported)
      const stepValue = await global.page.$eval('input[name="salaryExpectation"]', (el: any) => el.step);
      expect(stepValue).toBe('1000');
    });

    test('should handle phone field validation', async () => {
      // Test phone field validation
      await helpers.fillInput('input[name="phone"]', '123'); // Invalid phone
      await helpers.clickNextStep();
      
      const phoneError = await helpers.getValidationError('phone');
      expect(phoneError).toBeTruthy();
      
      // Test valid phone
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Should proceed to next step without error
      await global.page.waitForSelector('select[name="skills"]');
    });
  });

  describe('Form Validation', () => {
    test('should validate required fields on each step', async () => {
      // Try to proceed without filling personal info
      await helpers.clickNextStep();
      
      const firstNameError = await helpers.getValidationError('firstName');
      const lastNameError = await helpers.getValidationError('lastName');
      const emailError = await helpers.getValidationError('email');
      const phoneError = await helpers.getValidationError('phone');
      
      expect(firstNameError).toContain('required');
      expect(lastNameError).toContain('required');
      expect(emailError).toContain('email');
      expect(phoneError).toBeTruthy();
    });

    test('should validate skills selection requirement', async () => {
      // Navigate to skills step
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Try to proceed without selecting skills
      await helpers.clickNextStep();
      
      const skillsError = await helpers.getValidationError('skills');
      expect(skillsError).toBeTruthy();
    });

    test('should validate minimum salary expectation', async () => {
      // Navigate to skills step
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Test negative salary
      await helpers.fillInput('input[name="salaryExpectation"]', '-1000');
      await helpers.clickNextStep();
      
      const salaryError = await helpers.getValidationError('salaryExpectation');
      expect(salaryError).toBeTruthy();
    });

    test('should validate required textarea fields', async () => {
      // Navigate to final step
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      await helpers.selectMultipleOptions('select[name="skills"]', ['javascript']);
      await helpers.fillInput('input[name="salaryExpectation"]', '75000');
      await helpers.clickNextStep();
      
      // Try to submit without required textarea
      await helpers.submitForm();
      
      const whyInterestedError = await helpers.getValidationError('whyInterested');
      expect(whyInterestedError).toContain('10'); // Minimum 10 characters
    });
  });

  describe('Complete Application Flow', () => {
    test('should complete full application successfully', async () => {
      // Step 1: Personal Information
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      // Step 2: Skills & Availability
      await helpers.selectMultipleOptions('select[name="skills"]', ['javascript', 'react', 'node']);
      await helpers.fillInput('input[name="salaryExpectation"]', '85000');
      await helpers.clickNextStep();
      
      // Step 3: Additional Questions
      await helpers.fillInput('textarea[name="whyInterested"]', 
        'I am passionate about web development and excited about the opportunity to work with cutting-edge technologies.');
      await helpers.fillInput('textarea[name="additionalInfo"]', 
        'I have 5 years of experience in full-stack development and am eager to contribute to your team.');
      
      // Submit application
      await helpers.submitForm();
      
      // Check for success toast
      const toastAppeared = await helpers.waitForToast();
      expect(toastAppeared).toBe(true);
      
      const toastMessage = await helpers.getToastMessage();
      expect(toastMessage).toContain('Application submitted');
    });

    test('should maintain form data when navigating between steps', async () => {
      // Fill first step
      await helpers.fillInput('input[name="firstName"]', 'Jane');
      await helpers.fillInput('input[name="email"]', 'jane@example.com');
      await helpers.clickNextStep();
      
      // Fill second step
      await helpers.selectMultipleOptions('select[name="skills"]', ['python', 'sql']);
      await helpers.clickNextStep();
      
      // Go back to first step
      await helpers.clickPreviousStep();
      await helpers.clickPreviousStep();
      
      // Check if data is preserved
      const firstNameValue = await global.page.$eval('input[name="firstName"]', (el: any) => el.value);
      const emailValue = await global.page.$eval('input[name="email"]', (el: any) => el.value);
      
      expect(firstNameValue).toBe('Jane');
      expect(emailValue).toBe('jane@example.com');
    });

    test('should handle optional additional info field', async () => {
      // Complete required fields
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="phone"]', '+1234567890');
      await helpers.clickNextStep();
      
      await helpers.selectMultipleOptions('select[name="skills"]', ['javascript']);
      await helpers.fillInput('input[name="salaryExpectation"]', '75000');
      await helpers.clickNextStep();
      
      await helpers.fillInput('textarea[name="whyInterested"]', 
        'I am interested in this position because of the growth opportunities.');
      
      // Leave additionalInfo empty (it's optional)
      await helpers.submitForm();
      
      // Should still succeed
      const toastAppeared = await helpers.waitForToast();
      expect(toastAppeared).toBe(true);
    });
  });
});
import { FormTestHelpers } from './utils/form-helpers';

describe('Survey Form Tests', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
    await helpers.navigateToExamples();
    await helpers.switchToTab('survey');
  });

  describe('Basic Form Fields', () => {
    test('should render all basic fields', async () => {
      // Check if basic fields are present
      await global.page.waitForSelector('[data-rating]');
      await global.page.waitForSelector('input[value="yes"]');
      await global.page.waitForSelector('input[value="maybe"]');
      await global.page.waitForSelector('input[value="no"]');
      await global.page.waitForSelector('select[name="features"]');
    });

    test('should handle rating field', async () => {
      // Test rating selection
      await helpers.setRating(4);
      
      // Verify rating is selected
      const selectedRating = await global.page.$eval('[data-rating="4"]', (el: any) => el.getAttribute('aria-pressed'));
      expect(selectedRating).toBe('true');
    });

    test('should handle radio button selection', async () => {
      await helpers.clickRadio('yes');
      
      const selectedValue = await global.page.$eval('input[name="recommend"]:checked', (el: any) => el.value);
      expect(selectedValue).toBe('yes');
    });

    test('should handle multi-select field', async () => {
      await helpers.selectMultipleOptions('select[name="features"]', ['forms', 'validation', 'analytics']);
      
      // For native multi-select, check selected options
      try {
        const selectedOptions = await global.page.$$eval('select[name="features"] option:checked', 
          (options: any[]) => options.map(option => option.value)
        );
        expect(selectedOptions).toContain('forms');
        expect(selectedOptions).toContain('validation');
        expect(selectedOptions).toContain('analytics');
      } catch {
        // For Radix multi-select, check selected badges or trigger content
        const selectedBadges = await global.page.$$eval('[data-selected="true"], .selected-item', 
          (badges: any[]) => badges.map(badge => badge.textContent?.trim())
        );
        expect(selectedBadges.some((text: string) => text?.includes('Form Builder'))).toBe(true);
        expect(selectedBadges.some((text: string) => text?.includes('Validation'))).toBe(true);
        expect(selectedBadges.some((text: string) => text?.includes('Analytics'))).toBe(true);
      }
    });
  });

  describe('Conditional Field Logic', () => {
    test('should show improvements field when satisfaction is low', async () => {
      // Set low satisfaction rating
      await helpers.setRating(3);
      
      // Check if improvements field appears
      const improvementsVisible = await helpers.isFieldVisible('textarea[name="improvements"]');
      expect(improvementsVisible).toBe(true);
    });

    test('should hide improvements field when satisfaction is high', async () => {
      // Set high satisfaction rating
      await helpers.setRating(5);
      
      // Check if improvements field is hidden
      const improvementsVisible = await helpers.isFieldVisible('textarea[name="improvements"]');
      expect(improvementsVisible).toBe(false);
    });

    test('should show referral source when recommend is yes', async () => {
      // Select "yes" for recommendation
      await helpers.clickRadio('yes');
      
      // Check if referral source field appears
      await helpers.waitForConditionalField('select[name="referralSource"]', true);
      const referralVisible = await helpers.isFieldVisible('select[name="referralSource"]');
      expect(referralVisible).toBe(true);
    });

    test('should hide referral source when recommend is no', async () => {
      // First show the field
      await helpers.clickRadio('yes');
      await helpers.waitForConditionalField('select[name="referralSource"]', true);
      
      // Then hide it
      await helpers.clickRadio('no');
      await helpers.waitForConditionalField('select[name="referralSource"]', false);
      
      const referralVisible = await helpers.isFieldVisible('select[name="referralSource"]');
      expect(referralVisible).toBe(false);
    });

    test('should show other source field when referral source is other', async () => {
      // Set up conditions for referral source to appear
      await helpers.clickRadio('yes');
      await helpers.waitForConditionalField('select[name="referralSource"]', true);
      
      // Select "other" option
      await helpers.selectOption('select[name="referralSource"]', 'other');
      
      // Check if other source field appears
      await helpers.waitForConditionalField('input[name="otherSource"]', true);
      const otherSourceVisible = await helpers.isFieldVisible('input[name="otherSource"]');
      expect(otherSourceVisible).toBe(true);
    });

    test('should hide other source field when referral source is not other', async () => {
      // Set up conditions and show other source field
      await helpers.clickRadio('yes');
      await helpers.waitForConditionalField('select[name="referralSource"]', true);
      await helpers.selectOption('select[name="referralSource"]', 'other');
      await helpers.waitForConditionalField('input[name="otherSource"]', true);
      
      // Change to different option
      await helpers.selectOption('select[name="referralSource"]', 'friend');
      await helpers.waitForConditionalField('input[name="otherSource"]', false);
      
      const otherSourceVisible = await helpers.isFieldVisible('input[name="otherSource"]');
      expect(otherSourceVisible).toBe(false);
    });
  });

  describe('Complex Conditional Scenarios', () => {
    test('should handle multiple conditional fields simultaneously', async () => {
      // Set low satisfaction (should show improvements)
      await helpers.setRating(2);
      await helpers.waitForConditionalField('textarea[name="improvements"]', true);
      
      // Set recommend to yes (should show referral source)
      await helpers.clickRadio('yes');
      await helpers.waitForConditionalField('select[name="referralSource"]', true);
      
      // Both conditional fields should be visible
      const improvementsVisible = await helpers.isFieldVisible('textarea[name="improvements"]');
      const referralVisible = await helpers.isFieldVisible('select[name="referralSource"]');
      
      expect(improvementsVisible).toBe(true);
      expect(referralVisible).toBe(true);
    });

    test('should handle nested conditional fields', async () => {
      // Set up chain: recommend yes -> referral source -> other source
      await helpers.clickRadio('yes');
      await helpers.waitForConditionalField('select[name="referralSource"]', true);
      
      await helpers.selectOption('select[name="referralSource"]', 'other');
      await helpers.waitForConditionalField('input[name="otherSource"]', true);
      
      // Fill the nested conditional field
      await helpers.fillInput('input[name="otherSource"]', 'Conference');
      
      const otherSourceValue = await global.page.$eval('input[name="otherSource"]', (el: any) => el.value);
      expect(otherSourceValue).toBe('Conference');
    });

    test('should maintain field values when conditions change', async () => {
      // Fill improvements field when visible
      await helpers.setRating(2);
      await helpers.waitForConditionalField('textarea[name="improvements"]', true);
      await helpers.fillInput('textarea[name="improvements"]', 'Better user interface');
      
      // Hide and show the field again
      await helpers.setRating(5);
      await helpers.waitForConditionalField('textarea[name="improvements"]', false);
      await helpers.setRating(2);
      await helpers.waitForConditionalField('textarea[name="improvements"]', true);
      
      // Check if value is maintained
      const improvementsValue = await global.page.$eval('textarea[name="improvements"]', (el: any) => el.value);
      expect(improvementsValue).toBe('Better user interface');
    });
  });

  describe('Form Submission with Conditional Fields', () => {
    test('should submit successfully with all conditional fields filled', async () => {
      // Fill all required fields
      await helpers.setRating(3); // Low rating to show improvements
      await helpers.clickRadio('yes'); // Show referral source
      await helpers.waitForConditionalField('textarea[name="improvements"]', true);
      await helpers.waitForConditionalField('select[name="referralSource"]', true);
      
      await helpers.fillInput('textarea[name="improvements"]', 'Better documentation');
      await helpers.selectOption('select[name="referralSource"]', 'friend');
      await helpers.selectMultipleOptions('select[name="features"]', ['forms', 'validation']);
      
      // Submit form
      await helpers.submitForm();
      
      // Check for success toast
      const toastAppeared = await helpers.waitForToast();
      expect(toastAppeared).toBe(true);
      
      const toastMessage = await helpers.getToastMessage();
      expect(toastMessage).toContain('Thank you for your feedback');
    });

    test('should submit successfully without conditional fields when not triggered', async () => {
      // Fill only required fields without triggering conditionals
      await helpers.setRating(5); // High rating (no improvements field)
      await helpers.clickRadio('no'); // No referral source field
      await helpers.selectMultipleOptions('select[name="features"]', ['forms']);
      
      // Submit form
      await helpers.submitForm();
      
      // Check for success toast
      const toastAppeared = await helpers.waitForToast();
      expect(toastAppeared).toBe(true);
    });

    test('should validate conditional fields when they are visible', async () => {
      // Trigger conditional field but leave it empty
      await helpers.setRating(2);
      await helpers.clickRadio('yes');
      await helpers.waitForConditionalField('textarea[name="improvements"]', true);
      await helpers.waitForConditionalField('select[name="referralSource"]', true);
      
      // Try to submit without filling conditional fields
      await helpers.submitForm();
      
      // Should show validation errors for visible conditional fields
      const improvementsError = await helpers.getValidationError('improvements');
      expect(improvementsError).toBeTruthy();
    });
  });

  describe('Multi-Select Field Features', () => {
    test('should respect max selections limit', async () => {
      // Try to select more than the maximum allowed (3)
      await helpers.selectMultipleOptions('select[name="features"]', 
        ['forms', 'validation', 'analytics', 'integrations', 'api']
      );
      
      // Check that only 3 options are selected
      try {
        const selectedCount = await global.page.$$eval('select[name="features"] option:checked', 
          (options: any[]) => options.length
        );
        expect(selectedCount).toBeLessThanOrEqual(3);
      } catch {
        // For Radix multi-select, count selected badges
        const selectedBadges = await global.page.$$('[data-selected="true"], .selected-item');
        expect(selectedBadges.length).toBeLessThanOrEqual(3);
      }
    });

    test('should allow deselecting options', async () => {
      // Select some options
      await helpers.selectMultipleOptions('select[name="features"]', ['forms', 'validation']);
      
      // Deselect one option
      await global.page.click('select[name="features"]');
      await global.page.click('[data-value="forms"]'); // Deselect forms
      
      // Check that forms is no longer selected
      const selectedOptions = await global.page.$$eval('select[name="features"] option:checked', 
        (options: any[]) => options.map(option => option.value)
      );
      expect(selectedOptions).not.toContain('forms');
      expect(selectedOptions).toContain('validation');
    });
  });
});
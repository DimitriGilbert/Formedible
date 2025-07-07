import { FormTestHelpers } from './utils/form-helpers';

describe('Working Contact Form Test', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
  });

  test('should interact with contact form using correct selectors', async () => {
    console.log('🧪 Testing contact form with correct selectors...');
    
    await helpers.navigateToExamples();
    
    // Contact tab should be active by default, but let's ensure we're on it
    await helpers.switchToTab('contact');
    
    console.log('✅ Switched to contact tab');
    
    // Fill name field (this should work)
    await helpers.fillInput('input[name="name"]', 'John Doe');
    console.log('✅ Filled name field');
    
    // Fill email field (this should work)
    await helpers.fillInput('input[name="email"]', 'john@example.com');
    console.log('✅ Filled email field');
    
    // For the subject field, we need to use the combobox approach
    console.log('🔍 Attempting to interact with subject field...');
    
    // Click the combobox button to open dropdown
    await global.page.waitForSelector('button[role="combobox"]', { visible: true });
    await global.page.click('button[role="combobox"]');
    console.log('✅ Clicked subject dropdown');
    
    // Wait for dropdown options to appear
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Look for dropdown options
    const options = await global.page.$$('[role="option"]');
    console.log(`📋 Found ${options.length} dropdown options`);
    
    if (options.length > 0) {
      // Click the first option (or look for specific text)
      await global.page.click('[role="option"]');
      console.log('✅ Selected dropdown option');
    }
    
    // Fill message field (this should work)
    await helpers.fillInput('textarea[name="message"]', 'This is a test message for the contact form.');
    console.log('✅ Filled message field');
    
    // Handle checkbox - look for the actual checkbox input
    const checkboxes = await global.page.$$('input[type="checkbox"]');
    console.log(`☑️ Found ${checkboxes.length} checkboxes`);
    
    if (checkboxes.length > 0) {
      await global.page.click('input[type="checkbox"]');
      console.log('✅ Clicked checkbox');
    }
    
    // Try to submit the form
    console.log('🚀 Attempting to submit form...');
    const submitButton = await global.page.$('button[type="submit"]');
    
    if (submitButton) {
      await global.page.click('button[type="submit"]');
      console.log('✅ Clicked submit button');
      
      // Wait for potential toast message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for toast
      const toast = await global.page.$('[data-sonner-toast]');
      if (toast) {
        const toastText = await global.page.evaluate((el: any) => el.textContent, toast);
        console.log(`🎉 Toast message: ${toastText}`);
      } else {
        console.log('❌ No toast message found');
      }
    } else {
      console.log('❌ Submit button not found');
    }
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
  }, 60000);
});
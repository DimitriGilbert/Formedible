import { FormTestHelpers } from './utils/form-helpers';

describe('Checkout Debug Test', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
    await helpers.navigateToExamples();
  });

  test('should switch to checkout tab', async () => {
    console.log('🔍 Starting checkout debug test...');
    
    // Try to switch to checkout tab
    try {
      await helpers.switchToTab('checkout');
      console.log('✅ Successfully switched to checkout tab');
      
      // Take screenshot
      await global.page.screenshot({ path: 'debug-checkout-tab.png', fullPage: true });
      console.log('📸 Screenshot taken: debug-checkout-tab.png');
      
      // Check for form fields
      const firstNameExists = await global.page.$('input[name="firstName"]') !== null;
      console.log(`📝 First name field found: ${firstNameExists}`);
      
    } catch (error) {
      console.error('❌ Error switching to checkout tab:', error);
      await global.page.screenshot({ path: 'debug-checkout-error.png', fullPage: true });
    }
  });
});
import { FormTestHelpers } from './utils/form-helpers';

describe('Debug Test - Check Page Loading', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
  });

  test('should load examples page and show tabs', async () => {
    console.log('🔍 Starting debug test...');
    
    // Navigate to examples page
    await helpers.navigateToExamples();
    console.log('✅ Navigated to examples page');
    
    // Take a screenshot
    await global.page.screenshot({ path: 'debug-page-load.png', fullPage: true });
    console.log('📸 Screenshot taken: debug-page-load.png');
    
    // Check if tabs are present
    const tabs = await global.page.$$('[role="tablist"] [role="tab"]');
    console.log(`📋 Found ${tabs.length} tabs`);
    
    // List all tabs
    for (let i = 0; i < tabs.length; i++) {
      const tabText = await global.page.evaluate((el: any) => el.textContent, tabs[i]);
      const tabValue = await global.page.evaluate((el: any) => el.getAttribute('data-value'), tabs[i]);
      console.log(`  Tab ${i}: "${tabText}" (data-value="${tabValue}")`);
    }
    
    // Try to click contact tab
    console.log('🖱️ Attempting to click contact tab...');
    try {
      await helpers.switchToTab('contact');
      console.log('✅ Successfully switched to contact tab');
      
      // Take another screenshot
      await global.page.screenshot({ path: 'debug-contact-tab.png', fullPage: true });
      console.log('📸 Screenshot taken: debug-contact-tab.png');
      
      // Check for form fields
      const nameField = await global.page.$('input[name="name"]');
      const emailField = await global.page.$('input[name="email"]');
      const subjectField = await global.page.$('select[name="subject"]');
      
      console.log(`📝 Name field found: ${!!nameField}`);
      console.log(`📧 Email field found: ${!!emailField}`);
      console.log(`📋 Subject field found: ${!!subjectField}`);
      
    } catch (error) {
      console.error('❌ Error switching to contact tab:', error);
      await global.page.screenshot({ path: 'debug-error.png', fullPage: true });
    }
    
    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
  }, 30000); // 30 second timeout
});
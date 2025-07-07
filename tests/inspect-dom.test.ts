import { FormTestHelpers } from './utils/form-helpers';

describe('DOM Inspector', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
  });

  test('should inspect tab structure', async () => {
    console.log('🔍 Inspecting DOM structure...');
    
    // Navigate to examples page
    await helpers.navigateToExamples();
    
    // Get all tab-related elements
    const tabsContainer = await global.page.$('[role="tablist"]');
    if (tabsContainer) {
      const tabsHTML = await global.page.evaluate((el: any) => el.outerHTML, tabsContainer);
      console.log('📋 Tabs container HTML:');
      console.log(tabsHTML.substring(0, 1000) + '...');
    }
    
    // Check for different possible tab selectors
    const possibleSelectors = [
      '[role="tab"]',
      '[data-value]',
      'button[role="tab"]',
      '.tabs-trigger',
      '[data-state]'
    ];
    
    for (const selector of possibleSelectors) {
      const elements = await global.page.$$(selector);
      console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
      
      if (elements.length > 0) {
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const html = await global.page.evaluate((el: any) => el.outerHTML, elements[i]);
          console.log(`  Element ${i}: ${html.substring(0, 200)}...`);
        }
      }
    }
    
    // Check for contact form specifically
    console.log('\n🔍 Looking for contact form elements...');
    const contactSelectors = [
      'input[name="name"]',
      'input[name="email"]',
      'select[name="subject"]',
      'textarea[name="message"]'
    ];
    
    for (const selector of contactSelectors) {
      const element = await global.page.$(selector);
      console.log(`📝 ${selector}: ${element ? 'FOUND' : 'NOT FOUND'}`);
    }
    
    // Keep browser open for manual inspection
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }, 60000); // 60 second timeout
});
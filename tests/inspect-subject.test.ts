import { FormTestHelpers } from './utils/form-helpers';

describe('Subject Field Inspector', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
  });

  test('should find subject field structure', async () => {
    console.log('🔍 Looking for subject field...');
    
    await helpers.navigateToExamples();
    
    // The contact tab should be active by default, but let's make sure
    await helpers.switchToTab('contact');
    
    // Look for different possible subject field selectors
    const possibleSelectors = [
      'select[name="subject"]',
      '[name="subject"]',
      'button[role="combobox"]',
      '[data-placeholder*="subject" i]',
      '[aria-label*="subject" i]',
      'label:contains("Subject")',
      'button[aria-haspopup="listbox"]'
    ];
    
    for (const selector of possibleSelectors) {
      try {
        const elements = await global.page.$$(selector);
        console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
        
        if (elements.length > 0) {
          const html = await global.page.evaluate((el: any) => el.outerHTML, elements[0]);
          console.log(`  HTML: ${html.substring(0, 300)}...`);
        }
      } catch (error) {
        console.log(`❌ Error with selector ${selector}: ${error}`);
      }
    }
    
    // Look for all form elements in the contact form
    console.log('\n🔍 All form elements in contact form:');
    const formElements = await global.page.$$('input, select, textarea, button[role="combobox"], [role="combobox"]');
    
    for (let i = 0; i < formElements.length; i++) {
      const tagName = await global.page.evaluate((el: any) => el.tagName, formElements[i]);
      const name = await global.page.evaluate((el: any) => el.name || el.getAttribute('name'), formElements[i]);
      const role = await global.page.evaluate((el: any) => el.getAttribute('role'), formElements[i]);
      const type = await global.page.evaluate((el: any) => el.type, formElements[i]);
      
      console.log(`  ${i}: <${tagName.toLowerCase()}> name="${name}" role="${role}" type="${type}"`);
    }
    
    // Keep browser open
    await new Promise(resolve => setTimeout(resolve, 10000));
  }, 60000);
});
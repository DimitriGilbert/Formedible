import { FormTestHelpers } from './utils/form-helpers';

describe('Real Debug Test', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
    await helpers.navigateToExamples();
  });

  test('should actually debug tab switching', async () => {
    console.log('🔍 Real debug test starting...');
    
    // Take initial screenshot
    await global.page.screenshot({ path: 'before-click.png', fullPage: true });
    console.log('📸 Before click screenshot taken');
    
    // Get current active tab
    const activeBefore = await global.page.evaluate(() => {
      const activeTab = document.querySelector('[data-state="active"]');
      return activeTab ? activeTab.textContent?.trim() : 'none';
    });
    console.log(`🎯 Active tab before: ${activeBefore}`);
    
    // Get all tab buttons and their states
    const tabStates = await global.page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[data-slot="tabs-trigger"]'));
      return tabs.map(tab => ({
        text: tab.textContent?.trim(),
        state: tab.getAttribute('data-state'),
        value: tab.getAttribute('value')
      }));
    });
    console.log('📋 All tabs:', JSON.stringify(tabStates, null, 2));
    
    // Try to click checkout tab using helper
    console.log('🖱️ Attempting to click checkout...');
    try {
      await helpers.switchToTab('checkout');
      console.log('✅ Helper method completed');
    } catch (error) {
      console.error('❌ Helper method failed:', error);
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take after screenshot
    await global.page.screenshot({ path: 'after-click.png', fullPage: true });
    console.log('📸 After click screenshot taken');
    
    // Get active tab after
    const activeAfter = await global.page.evaluate(() => {
      const activeTab = document.querySelector('[data-state="active"]');
      return activeTab ? activeTab.textContent?.trim() : 'none';
    });
    console.log(`🎯 Active tab after: ${activeAfter}`);
    
    // Check if it actually changed
    console.log(`🔄 Tab changed: ${activeBefore !== activeAfter}`);
  });
});
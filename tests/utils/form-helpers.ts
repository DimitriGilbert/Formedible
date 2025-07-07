import { Page } from 'puppeteer';

export class FormTestHelpers {
  constructor(private page: Page) {}

  async navigateToExamples() {
    await this.page.goto('http://localhost:3000/docs/examples');
    await this.page.waitForSelector('[data-tabs-root]', { timeout: 5000 });
  }

  async switchToTab(tabName: string) {
    try {
      // Wait for tabs to be available
      await this.page.waitForSelector('[data-tabs-root]', { timeout: 3000 });
      
      // Get all tab triggers
      const tabTriggers = await this.page.$$('[data-tabs-trigger]');
      
      for (const trigger of tabTriggers) {
        const text = await trigger.evaluate(el => el.textContent?.toLowerCase().trim());
        if (text?.includes(tabName.toLowerCase())) {
          await trigger.click();
          // Wait a bit for tab content to load
          await this.page.waitForTimeout(500);
          return;
        }
      }
      
      throw new Error(`Tab "${tabName}" not found`);
    } catch (error) {
      console.error(`Failed to switch to tab "${tabName}":`, error);
      throw error;
    }
  }

  async fillInput(selector: string, value: string) {
    // Handle both native inputs and Radix inputs
    const radixSelector = selector.includes('[data-slot="input"]') ? selector : `[data-slot="input"]${selector.includes('[name=') ? selector.substring(selector.indexOf('[name=')) : ''}`;
    
    try {
      // Try Radix input first
      await this.page.waitForSelector(radixSelector, { timeout: 1000 });
      await this.page.click(radixSelector);
      await this.page.evaluate((sel) => {
        const element = document.querySelector(sel) as HTMLInputElement;
        if (element) {
          element.value = '';
        }
      }, radixSelector);
      await this.page.type(radixSelector, value);
    } catch {
      // Fallback to native selector
      await this.page.waitForSelector(selector, { timeout: 3000 });
      await this.page.click(selector);
      await this.page.evaluate((sel) => {
        const element = document.querySelector(sel) as HTMLInputElement;
        if (element) {
          element.value = '';
        }
      }, selector);
      await this.page.type(selector, value);
    }
  }

  async selectOption(selector: string, value: string) {
    try {
      // Try Radix Select first
      const selectTrigger = `[data-slot="select-trigger"]`;
      await this.page.waitForSelector(selectTrigger, { timeout: 2000 });
      await this.page.click(selectTrigger);
      
      // Wait for dropdown to open
      await this.page.waitForTimeout(300);
      
      // Click the option
      const optionSelector = `[data-slot="select-item"][data-value="${value}"]`;
      await this.page.waitForSelector(optionSelector, { timeout: 2000 });
      await this.page.click(optionSelector);
    } catch {
      // Fallback to native select
      await this.page.waitForSelector(selector, { timeout: 3000 });
      await this.page.select(selector, value);
    }
  }

  async selectMultipleOptions(selector: string, values: string[]) {
    try {
      // Try Radix Multi-Select first
      const multiSelectTrigger = `[data-slot="select-trigger"]`;
      await this.page.waitForSelector(multiSelectTrigger, { timeout: 2000 });
      
      for (const value of values) {
        await this.page.click(multiSelectTrigger);
        await this.page.waitForTimeout(200);
        
        // Try different option selectors
        const optionSelectors = [
          `[data-slot="select-item"][data-value="${value}"]`,
          `[data-value="${value}"]`,
          `[role="option"][data-value="${value}"]`
        ];
        
        let optionClicked = false;
        for (const optionSelector of optionSelectors) {
          try {
            await this.page.waitForSelector(optionSelector, { timeout: 1000 });
            await this.page.click(optionSelector);
            optionClicked = true;
            break;
          } catch {
            continue;
          }
        }
        
        if (!optionClicked) {
          console.warn(`Could not click option with value: ${value}`);
        }
        
        await this.page.waitForTimeout(200);
      }
      
      // Close dropdown by clicking outside
      await this.page.click('body');
    } catch {
      // Fallback to native multi-select
      await this.page.waitForSelector(selector, { timeout: 3000 });
      await this.page.evaluate((sel, vals) => {
        const select = document.querySelector(sel) as HTMLSelectElement;
        if (select) {
          // Clear all selections first
          for (let option of select.options) {
            option.selected = false;
          }
          // Select the specified values
          for (let option of select.options) {
            if (vals.includes(option.value)) {
              option.selected = true;
            }
          }
          // Trigger change event
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, selector, values);
    }
  }

  async clickCheckbox(selector: string) {
    try {
      // Try Radix Checkbox first
      const checkboxSelector = `[data-slot="checkbox"]`;
      await this.page.waitForSelector(checkboxSelector, { timeout: 2000 });
      await this.page.click(checkboxSelector);
    } catch {
      // Fallback to native checkbox
      await this.page.waitForSelector(selector, { timeout: 3000 });
      await this.page.click(selector);
    }
  }

  async clickRadio(value: string) {
    try {
      // Try Radix Radio Group first
      const radioSelector = `[data-slot="radio-group-item"][value="${value}"]`;
      await this.page.waitForSelector(radioSelector, { timeout: 2000 });
      await this.page.click(radioSelector);
    } catch {
      // Fallback to native radio
      const nativeRadioSelector = `input[value="${value}"]`;
      await this.page.waitForSelector(nativeRadioSelector, { timeout: 3000 });
      await this.page.click(nativeRadioSelector);
    }
  }

  async setRating(rating: number) {
    try {
      // Try Radix Rating component
      const ratingSelector = `[data-slot="rating-item"][data-value="${rating}"]`;
      await this.page.waitForSelector(ratingSelector, { timeout: 2000 });
      await this.page.click(ratingSelector);
    } catch {
      // Try alternative rating selectors
      const altSelectors = [
        `[data-rating="${rating}"]`,
        `[data-value="${rating}"][role="button"]`,
        `button[data-rating="${rating}"]`
      ];
      
      for (const selector of altSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 1000 });
          await this.page.click(selector);
          return;
        } catch {
          continue;
        }
      }
      
      throw new Error(`Could not find rating element for value: ${rating}`);
    }
  }

  async clickNextStep() {
    const nextSelectors = [
      'button[data-step="next"]',
      '[data-slot="button"]'
    ];
    
    for (const selector of nextSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 1000 });
        await this.page.click(selector);
        await this.page.waitForTimeout(500);
        return;
      } catch {
        continue;
      }
    }
    
    // Fallback: find button by text content
    const buttons = await this.page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase().trim());
      if (text?.includes('next') || text?.includes('continue')) {
        await button.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }
    
    throw new Error('Could not find Next/Continue button');
  }

  async clickPreviousStep() {
    const prevSelectors = [
      'button[data-step="previous"]',
      '[data-slot="button"]'
    ];
    
    for (const selector of prevSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 1000 });
        await this.page.click(selector);
        await this.page.waitForTimeout(500);
        return;
      } catch {
        continue;
      }
    }
    
    // Fallback: find button by text content
    const buttons = await this.page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase().trim());
      if (text?.includes('previous') || text?.includes('back')) {
        await button.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }
    
    throw new Error('Could not find Previous/Back button');
  }

  async getProgressPercentage() {
    try {
      const progressSelectors = [
        '[data-slot="progress"] [data-progress-value]',
        '[role="progressbar"]',
        '.progress-value',
        '[data-progress]'
      ];
      
      for (const selector of progressSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            const value = await element.evaluate(el => 
              el.getAttribute('aria-valuenow') || 
              el.getAttribute('data-value') || 
              el.textContent?.match(/\d+/)?.[0]
            );
            if (value) return value;
          }
        } catch {
          continue;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  async waitForConditionalField(selector: string, shouldBeVisible: boolean) {
    const timeout = 3000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const isVisible = await this.isFieldVisible(selector);
      if (isVisible === shouldBeVisible) {
        return;
      }
      await this.page.waitForTimeout(100);
    }
    
    throw new Error(`Conditional field ${selector} did not ${shouldBeVisible ? 'appear' : 'disappear'} within ${timeout}ms`);
  }

  async submitForm() {
    const submitSelectors = [
      'button[type="submit"]',
      '[data-slot="button"][type="submit"]'
    ];
    
    for (const selector of submitSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 1000 });
        await this.page.click(selector);
        await this.page.waitForTimeout(1000);
        return;
      } catch {
        continue;
      }
    }
    
    // Fallback: find submit button by text
    const buttons = await this.page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase().trim());
      if (text?.includes('submit') || text?.includes('send') || text?.includes('complete')) {
        await button.click();
        await this.page.waitForTimeout(1000);
        return;
      }
    }
    
    throw new Error('Could not find submit button');
  }

  async waitForToast() {
    try {
      await this.page.waitForSelector('[data-sonner-toaster]', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getToastMessage() {
    try {
      const toast = await this.page.$('[data-sonner-toast]');
      if (toast) {
        return await toast.evaluate(el => el.textContent?.trim());
      }
      return null;
    } catch {
      return null;
    }
  }

  async getValidationError(fieldName: string) {
    try {
      // Try multiple possible error selectors
      const errorSelectors = [
        `[data-field="${fieldName}"] [data-error]`,
        `[data-field="${fieldName}"] .error-message`,
        `[name="${fieldName}"] + .error-message`,
        `[name="${fieldName}"] ~ .error-message`,
        `[data-slot="error-message"][data-field="${fieldName}"]`,
        `.field-error[data-field="${fieldName}"]`,
        `[data-slot="form-message"][data-field="${fieldName}"]`
      ];

      for (const selector of errorSelectors) {
        const errorElement = await this.page.$(selector);
        if (errorElement) {
          const errorText = await errorElement.evaluate(el => el.textContent?.trim());
          if (errorText) {
            return errorText;
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  async isFieldVisible(selector: string) {
    try {
      const element = await this.page.$(selector);
      if (!element) return false;
      
      const isVisible = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      
      return isVisible;
    } catch {
      return false;
    }
  }
}
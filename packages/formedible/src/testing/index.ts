// Testing utilities for Formedible forms

export interface FormTesterConfig<T extends Record<string, unknown>> {
  fields?: Array<{
    name: string;
    type: string;
    label?: string;
    page?: number;
  }>;
  schema?: unknown;
  crossFieldValidation?: Array<{
    fields: (keyof T)[];
    validator: (values: Partial<T>) => string | null;
    message: string;
  }>;
  asyncValidation?: {
    [fieldName: string]: {
      validator: (value: unknown) => Promise<string | null>;
      debounceMs?: number;
      loadingMessage?: string;
    };
  };
}

export interface FormTesterOptions<T extends Record<string, unknown>> {
  config: FormTesterConfig<T>;
  container?: HTMLElement;
}

export interface FormTesterActions<T extends Record<string, unknown>> {
  fillField: (name: keyof T, value: unknown) => Promise<void>;
  fillFields: (values: Partial<T>) => Promise<void>;
  submitForm: () => Promise<void>;
  resetForm: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  expectError: (fieldName: keyof T, message?: string) => void;
  expectNoError: (fieldName: keyof T) => void;
  expectValid: () => void;
  expectInvalid: () => void;
  expectFieldValue: (fieldName: keyof T, value: unknown) => void;
  expectCurrentPage: (page: number) => void;
  waitForAsyncValidation: (fieldName: keyof T) => Promise<void>;
  triggerFieldFocus: (fieldName: keyof T) => Promise<void>;
  triggerFieldBlur: (fieldName: keyof T) => Promise<void>;
  getFormData: () => T;
}

export class FormTester<T extends Record<string, unknown>> {

  private container: HTMLElement;
  private formInstance: {
    form?: { state?: unknown };
    currentPage?: number;
    asyncValidationStates?: Record<string, { loading?: boolean }>;
    setCurrentPage?: (page: number) => void;
  } = {};

  constructor(options: FormTesterOptions<T>) {

    this.container = options.container || document.body;
  }

  private getFieldElement(fieldName: keyof T): HTMLElement | null {
    return this.container.querySelector(`[name="${String(fieldName)}"]`)?.closest('.field-wrapper, .form-field') as HTMLElement || null;
  }

  private getSubmitButton(): HTMLElement | null {
    return this.container.querySelector('button[type="submit"]') as HTMLElement || null;
  }

  private getNextButton(): HTMLElement | null {
    return this.container.querySelector('button:contains("Next"), button[data-testid="next-button"]') as HTMLElement || null;
  }

  private getPreviousButton(): HTMLElement | null {
    return this.container.querySelector('button:contains("Previous"), button[data-testid="previous-button"]') as HTMLElement || null;
  }

  async render(): Promise<FormTesterActions<T>> {
    const actions: FormTesterActions<T> = {
      fillField: async (name: keyof T, value: unknown) => {
        const field = this.getFieldElement(name);
        if (field) {
          const input = field.querySelector('input, select, textarea') as HTMLInputElement;
          if (input) {
            input.value = String(value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      },

      fillFields: async (values: Partial<T>) => {
        for (const [name, value] of Object.entries(values)) {
          await actions.fillField(name as keyof T, value);
        }
      },

      submitForm: async () => {
        const submitButton = this.getSubmitButton();
        if (submitButton) {
          submitButton.click();
        } else {
          const form = this.container.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true }));
          }
        }
      },

      resetForm: async () => {
        const form = this.container.querySelector('form');
        if (form) {
          form.reset();
        }
      },

      goToPage: async (page: number) => {
        if (this.formInstance && 'setCurrentPage' in this.formInstance && typeof this.formInstance.setCurrentPage === 'function') {
          this.formInstance.setCurrentPage(page);
        }
      },

      nextPage: async () => {
        const nextButton = this.getNextButton();
        if (nextButton) {
          nextButton.click();
        }
      },

      previousPage: async () => {
        const prevButton = this.getPreviousButton();
        if (prevButton) {
          prevButton.click();
        }
      },

      expectError: (fieldName: keyof T, message?: string) => {
        const field = this.getFieldElement(fieldName);
        if (!field) {
          throw new Error(`Field ${String(fieldName)} not found`);
        }
        
        const errorElement = field.querySelector('[role="alert"], .error-message, .text-destructive');
        if (!errorElement) {
          throw new Error(`No error found for field ${String(fieldName)}`);
        }
        
        if (message && !errorElement.textContent?.includes(message)) {
          throw new Error(`Expected error message "${message}" but got "${errorElement.textContent}"`);
        }
      },

      expectNoError: (fieldName: keyof T) => {
        const field = this.getFieldElement(fieldName);
        if (!field) {
          throw new Error(`Field ${String(fieldName)} not found`);
        }
        
        const errorElement = field.querySelector('[role="alert"], .error-message, .text-destructive');
        if (errorElement && errorElement.textContent?.trim()) {
          throw new Error(`Expected no error for field ${String(fieldName)} but found: ${errorElement.textContent}`);
        }
      },

      expectValid: () => {
        if (this.formInstance && this.formInstance.form) {
          const state = this.formInstance.form.state as { isValid: boolean };
          if (!state.isValid) {
            throw new Error('Expected form to be valid');
          }
        }
      },

      expectInvalid: () => {
        if (this.formInstance && this.formInstance.form) {
          const state = this.formInstance.form.state as { isValid: boolean };
          if (state.isValid) {
            throw new Error('Expected form to be invalid');
          }
        }
      },

      expectFieldValue: (fieldName: keyof T, value: unknown) => {
        const field = this.getFieldElement(fieldName);
        if (!field) {
          throw new Error(`Field ${String(fieldName)} not found`);
        }
        
        const input = field.querySelector('input, select, textarea') as HTMLInputElement;
        if (!input) {
          throw new Error(`Input element not found for field ${String(fieldName)}`);
        }
        
        if (input.value !== String(value)) {
          throw new Error(`Expected field ${String(fieldName)} to have value "${value}" but got "${input.value}"`);
        }
      },

      expectCurrentPage: (page: number) => {
        if (this.formInstance && this.formInstance.currentPage !== page) {
          throw new Error(`Expected to be on page ${page} but on page ${this.formInstance.currentPage}`);
        }
      },

      waitForAsyncValidation: async (fieldName: keyof T) => {
        return new Promise<void>((resolve) => {
          const checkValidation = () => {
            if (this.formInstance && this.formInstance.asyncValidationStates) {
              const state = this.formInstance.asyncValidationStates[String(fieldName)];
              if (!state || !state.loading) {
                resolve();
                return;
              }
            }
            setTimeout(checkValidation, 100);
          };
          checkValidation();
        });
      },

      triggerFieldFocus: async (fieldName: keyof T) => {
        const field = this.getFieldElement(fieldName);
        if (field) {
          const input = field.querySelector('input, select, textarea') as HTMLInputElement;
          if (input) {
            input.focus();
            input.dispatchEvent(new Event('focus', { bubbles: true }));
          }
        }
      },

      triggerFieldBlur: async (fieldName: keyof T) => {
        const field = this.getFieldElement(fieldName);
        if (field) {
          const input = field.querySelector('input, select, textarea') as HTMLInputElement;
          if (input) {
            input.blur();
            input.dispatchEvent(new Event('blur', { bubbles: true }));
          }
        }
      },

      getFormData: () => {
        if (this.formInstance && this.formInstance.form) {
          const state = this.formInstance.form.state as { values: T };
          return state.values;
        }
        return {} as T;
      }
    };

    return actions;
  }

  setFormInstance(instance: {
    form?: { state?: unknown };
    currentPage?: number;
    asyncValidationStates?: Record<string, { loading?: boolean }>;
    setCurrentPage?: (page: number) => void;
  }) {
    this.formInstance = instance;
  }
}

// Factory function for creating form testers
export function createFormTester<T extends Record<string, unknown>>(
  config: FormTesterConfig<T>,
  container?: HTMLElement
): FormTester<T> {
  return new FormTester({ config, container });
}

// Jest/Vitest matcher extensions
export const formMatchers = {
  toHaveError<T extends Record<string, unknown>>(this: unknown, tester: FormTester<T>, fieldName: keyof T, message?: string) {
    try {
      const actions = tester.render();
      actions.then(a => a.expectError(fieldName, message));
      return { pass: true, message: () => `Expected field ${String(fieldName)} to have error` };
    } catch (error) {
      return { pass: false, message: () => (error as Error).message };
    }
  },

  toHaveNoError<T extends Record<string, unknown>>(this: unknown, tester: FormTester<T>, fieldName: keyof T) {
    try {
      const actions = tester.render();
      actions.then(a => a.expectNoError(fieldName));
      return { pass: true, message: () => `Expected field ${String(fieldName)} to have no error` };
    } catch (error) {
      return { pass: false, message: () => (error as Error).message };
    }
  },

  toBeValid<T extends Record<string, unknown>>(this: unknown, tester: FormTester<T>) {
    try {
      const actions = tester.render();
      actions.then(a => a.expectValid());
      return { pass: true, message: () => 'Expected form to be valid' };
    } catch (error) {
      return { pass: false, message: () => (error as Error).message };
    }
  },

  toBeInvalid<T extends Record<string, unknown>>(this: unknown, tester: FormTester<T>) {
    try {
      const actions = tester.render();
      actions.then(a => a.expectInvalid());
      return { pass: true, message: () => 'Expected form to be invalid' };
    } catch (error) {
      return { pass: false, message: () => (error as Error).message };
    }
  }
};

// Example usage and documentation
export const examples = {
  basicUsage: `
    import { createFormTester } from '@formedible/testing';

    const config = {
      fields: [
        { name: 'email', type: 'email', label: 'Email' },
        { name: 'password', type: 'password', label: 'Password' },
      ],
    };

    test('form validation', async () => {
      const tester = createFormTester(config);
      const actions = await tester.render();

      // Fill invalid email
      await actions.fillField('email', 'invalid-email');
      actions.expectError('email', 'Invalid email');

      // Fill valid email
      await actions.fillField('email', 'test@example.com');
      actions.expectNoError('email');

      // Submit form
      await actions.submitForm();
    });
  `,

  crossFieldValidation: `
    test('cross-field validation', async () => {
      const config = {
        fields: [
          { name: 'password', type: 'password', label: 'Password' },
          { name: 'confirmPassword', type: 'password', label: 'Confirm Password' },
        ],
        crossFieldValidation: [{
          fields: ['password', 'confirmPassword'],
          validator: (values) => 
            values.password !== values.confirmPassword ? 'Passwords must match' : null,
          message: 'Passwords must match'
        }]
      };

      const tester = createFormTester(config);
      const actions = await tester.render();

      await actions.fillField('password', 'password123');
      await actions.fillField('confirmPassword', 'different');
      
      actions.expectError('password', 'Passwords must match');
      actions.expectError('confirmPassword', 'Passwords must match');
    });
  `,

  asyncValidation: `
    test('async validation', async () => {
      const config = {
        fields: [
          { name: 'username', type: 'text', label: 'Username' },
        ],
        asyncValidation: {
          username: {
            validator: async (value) => {
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 100));
              return value === 'taken' ? 'Username is taken' : null;
            },
            debounceMs: 300
          }
        }
      };

      const tester = createFormTester(config);
      const actions = await tester.render();

      await actions.fillField('username', 'taken');
      await actions.waitForAsyncValidation('username');
      
      actions.expectError('username', 'Username is taken');
    });
  `,

  multiPageForm: `
    test('multi-page form navigation', async () => {
      const config = {
        fields: [
          { name: 'firstName', type: 'text', label: 'First Name', page: 1 },
          { name: 'lastName', type: 'text', label: 'Last Name', page: 1 },
          { name: 'email', type: 'email', label: 'Email', page: 2 },
        ],
      };

      const tester = createFormTester(config);
      const actions = await tester.render();

      actions.expectCurrentPage(1);
      
      await actions.fillField('firstName', 'John');
      await actions.fillField('lastName', 'Doe');
      await actions.nextPage();
      
      actions.expectCurrentPage(2);
      
      await actions.fillField('email', 'john@example.com');
      await actions.submitForm();
    });
  `
};
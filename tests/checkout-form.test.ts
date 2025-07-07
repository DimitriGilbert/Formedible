import { FormTestHelpers } from './utils/form-helpers';

describe('Checkout Form Tests', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
    await helpers.navigateToExamples();
    await helpers.switchToTab('checkout');
  });

  describe('Multi-Page Checkout Flow', () => {
    test('should render shipping address page initially', async () => {
      // Check if shipping address fields are visible
      await global.page.waitForSelector('input[name="firstName"]');
      await global.page.waitForSelector('input[name="lastName"]');
      await global.page.waitForSelector('input[name="email"]');
      await global.page.waitForSelector('input[name="address"]');
      await global.page.waitForSelector('input[name="city"]');
      await global.page.waitForSelector('input[name="zipCode"]');
      
      // Check if payment fields are not visible yet
      const paymentMethodVisible = await helpers.isFieldVisible('input[value="card"]');
      expect(paymentMethodVisible).toBe(false);
    });

    test('should navigate through all checkout steps', async () => {
      // Step 1: Shipping Address
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="address"]', '123 Main Street');
      await helpers.fillInput('input[name="city"]', 'New York');
      await helpers.fillInput('input[name="zipCode"]', '10001');
      
      await helpers.clickNextStep();
      
      // Step 2: Payment
      await global.page.waitForSelector('input[value="card"]');
      await global.page.waitForSelector('input[value="paypal"]');
      await global.page.waitForSelector('input[value="apple_pay"]');
      
      await helpers.clickRadio('card');
      await helpers.fillInput('input[name="cardNumber"]', '4111111111111111');
      await helpers.fillInput('input[name="expiryDate"]', '12/25');
      
      await helpers.clickNextStep();
      
      // Step 3: Shipping Options
      await global.page.waitForSelector('input[value="standard"]');
      await global.page.waitForSelector('input[value="express"]');
      await global.page.waitForSelector('input[value="overnight"]');
      await global.page.waitForSelector('textarea[name="giftMessage"]');
    });

    test('should validate required fields on each step', async () => {
      // Try to proceed without filling shipping address
      await helpers.clickNextStep();
      
      const firstNameError = await helpers.getValidationError('firstName');
      const emailError = await helpers.getValidationError('email');
      const addressError = await helpers.getValidationError('address');
      
      expect(firstNameError).toContain('required');
      expect(emailError).toContain('email');
      expect(addressError).toContain('required');
    });
  });

  describe('Payment Method Conditional Fields', () => {
    test('should show card fields when card payment is selected', async () => {
      // Navigate to payment step
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="address"]', '123 Main Street');
      await helpers.fillInput('input[name="city"]', 'New York');
      await helpers.fillInput('input[name="zipCode"]', '10001');
      await helpers.clickNextStep();
      
      // Select card payment
      await helpers.clickRadio('card');
      
      // Check if card fields appear
      await helpers.waitForConditionalField('input[name="cardNumber"]', true);
      await helpers.waitForConditionalField('input[name="expiryDate"]', true);
      
      const cardNumberVisible = await helpers.isFieldVisible('input[name="cardNumber"]');
      const expiryDateVisible = await helpers.isFieldVisible('input[name="expiryDate"]');
      
      expect(cardNumberVisible).toBe(true);
      expect(expiryDateVisible).toBe(true);
    });

    test('should hide card fields when non-card payment is selected', async () => {
      // Navigate to payment step and select card first
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="address"]', '123 Main Street');
      await helpers.fillInput('input[name="city"]', 'New York');
      await helpers.fillInput('input[name="zipCode"]', '10001');
      await helpers.clickNextStep();
      
      await helpers.clickRadio('card');
      await helpers.waitForConditionalField('input[name="cardNumber"]', true);
      
      // Switch to PayPal
      await helpers.clickRadio('paypal');
      await helpers.waitForConditionalField('input[name="cardNumber"]', false);
      
      const cardNumberVisible = await helpers.isFieldVisible('input[name="cardNumber"]');
      const expiryDateVisible = await helpers.isFieldVisible('input[name="expiryDate"]');
      
      expect(cardNumberVisible).toBe(false);
      expect(expiryDateVisible).toBe(false);
    });
  });

  describe('Complete Checkout Flow', () => {
    test('should complete entire checkout process successfully', async () => {
      // Step 1: Shipping Address
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="lastName"]', 'Doe');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.fillInput('input[name="address"]', '123 Main Street');
      await helpers.fillInput('input[name="city"]', 'New York');
      await helpers.fillInput('input[name="zipCode"]', '10001');
      await helpers.clickNextStep();
      
      // Step 2: Payment
      await helpers.clickRadio('card');
      await helpers.waitForConditionalField('input[name="cardNumber"]', true);
      await helpers.fillInput('input[name="cardNumber"]', '4111111111111111');
      await helpers.fillInput('input[name="expiryDate"]', '12/25');
      await helpers.clickNextStep();
      
      // Step 3: Shipping & Submit
      await helpers.clickRadio('express');
      await helpers.fillInput('textarea[name="giftMessage"]', 'Thank you for your business!');
      
      // Submit order
      await helpers.submitForm();
      
      // Check for success toast
      const toastAppeared = await helpers.waitForToast();
      expect(toastAppeared).toBe(true);
      
      const toastMessage = await helpers.getToastMessage();
      expect(toastMessage).toContain('Order placed successfully');
    });

    test('should complete checkout with PayPal payment', async () => {
      // Step 1: Shipping Address
      await helpers.fillInput('input[name="firstName"]', 'Jane');
      await helpers.fillInput('input[name="lastName"]', 'Smith');
      await helpers.fillInput('input[name="email"]', 'jane@example.com');
      await helpers.fillInput('input[name="address"]', '456 Oak Avenue');
      await helpers.fillInput('input[name="city"]', 'Los Angeles');
      await helpers.fillInput('input[name="zipCode"]', '90210');
      await helpers.clickNextStep();
      
      // Step 2: Payment (PayPal - no card details needed)
      await helpers.clickRadio('paypal');
      await helpers.clickNextStep();
      
      // Step 3: Shipping & Submit
      await helpers.clickRadio('standard');
      await helpers.submitForm();
      
      // Check for success
      const toastAppeared = await helpers.waitForToast();
      expect(toastAppeared).toBe(true);
    });

    test('should maintain form data when navigating between steps', async () => {
      // Fill shipping address
      await helpers.fillInput('input[name="firstName"]', 'John');
      await helpers.fillInput('input[name="email"]', 'john@example.com');
      await helpers.clickNextStep();
      
      // Go to payment step
      await helpers.clickRadio('card');
      await helpers.clickNextStep();
      
      // Go back to shipping
      await helpers.clickPreviousStep();
      await helpers.clickPreviousStep();
      
      // Check if data is preserved
      const firstNameValue = await global.page.$eval('input[name="firstName"]', (el: any) => el.value);
      const emailValue = await global.page.$eval('input[name="email"]', (el: any) => el.value);
      
      expect(firstNameValue).toBe('John');
      expect(emailValue).toBe('john@example.com');
    });
  });

  describe('Form Validation', () => {
    test('should validate email format in shipping address', async () => {
      await helpers.fillInput('input[name="email"]', 'invalid-email');
      await helpers.clickNextStep();
      
      const emailError = await helpers.getValidationError('email');
      expect(emailError).toContain('email');
    });

    test('should validate ZIP code format', async () => {
      await helpers.fillInput('input[name="zipCode"]', '123'); // Too short
      await helpers.clickNextStep();
      
      const zipError = await helpers.getValidationError('zipCode');
      expect(zipError).toBeTruthy();
    });
  });
});
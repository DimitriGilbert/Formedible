import { FormTestHelpers } from './utils/form-helpers';

describe('Super Fast Contact Form Test', () => {
  let helpers: FormTestHelpers;

  beforeEach(async () => {
    helpers = new FormTestHelpers(global.page);
  });

  test('should fill and submit contact form super fast', async () => {
    console.time('Total test time');
    
    console.time('Navigate');
    await helpers.navigateToExamples();
    console.timeEnd('Navigate');
    
    console.time('Switch tab');
    await helpers.switchToTab('contact');
    console.timeEnd('Switch tab');
    
    console.time('Fill name');
    await helpers.fillInput('input[name="name"]', 'John Doe');
    console.timeEnd('Fill name');
    
    console.time('Fill email');
    await helpers.fillInput('input[name="email"]', 'john@example.com');
    console.timeEnd('Fill email');
    
    console.time('Select subject');
    await helpers.selectOption('select[name="subject"]', 'support');
    console.timeEnd('Select subject');
    
    console.time('Fill message');
    await helpers.fillInput('textarea[name="message"]', 'Fast test message');
    console.timeEnd('Fill message');
    
    console.time('Click checkbox');
    await helpers.clickCheckbox('input[type="checkbox"]');
    console.timeEnd('Click checkbox');
    
    console.time('Submit form');
    await helpers.submitForm();
    console.timeEnd('Submit form');
    
    console.time('Wait for toast');
    const toastAppeared = await helpers.waitForToast();
    console.timeEnd('Wait for toast');
    
    console.timeEnd('Total test time');
    
    expect(toastAppeared).toBe(true);
    
    const toastMessage = await helpers.getToastMessage();
    expect(toastMessage).toContain('Message sent successfully');
  });
});
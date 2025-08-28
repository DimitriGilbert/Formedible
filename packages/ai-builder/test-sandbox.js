/**
 * Simple test script to verify sandbox templates are working
 */

import { 
  createSandboxFromFields, 
  createSandboxWithTemplate,
  getAvailableTemplates,
} from './dist/index.js';

console.log('Testing Formedible Sandbox Templates...\n');

// Test 1: Check available templates
console.log('1. Available Templates:');
const templates = getAvailableTemplates();
templates.forEach((template, index) => {
  console.log(`   ${index + 1}. ${template.name} (${template.complexity}): ${template.description}`);
});
console.log();

// Test 2: Create sandbox from field configuration
console.log('2. Creating sandbox from fields...');
const testFields = [
  {
    name: 'firstName',
    type: 'text',
    label: 'First Name',
    placeholder: 'Enter your first name',
    validation: true
  },
  {
    name: 'email',
    type: 'email', 
    label: 'Email Address',
    placeholder: 'Enter your email',
    validation: true
  },
  {
    name: 'interests',
    type: 'checkbox',
    label: 'Interests',
    options: [
      { value: 'tech', label: 'Technology' },
      { value: 'design', label: 'Design' },
      { value: 'business', label: 'Business' }
    ]
  }
];

try {
  const sandbox = createSandboxFromFields(testFields, {
    title: 'Test Contact Form',
    description: 'Please fill out your information'
  });
  
  console.log('   ✓ Successfully created sandbox with', Object.keys(sandbox).length, 'files');
  console.log('   Files:', Object.keys(sandbox).join(', '));
  
  // Check if FormComponent has the generated form
  const formComponent = sandbox['/FormComponent.tsx'];
  if (formComponent && formComponent.code.includes('firstName') && formComponent.code.includes('email')) {
    console.log('   ✓ Form component contains expected fields');
  } else {
    console.log('   ✗ Form component missing expected fields');
  }
  
} catch (error) {
  console.log('   ✗ Error creating sandbox:', error.message);
}
console.log();

// Test 3: Create sandbox with template
console.log('3. Creating sandbox with advanced template...');
try {
  const advancedSandbox = createSandboxWithTemplate('advanced');
  console.log('   ✓ Successfully created advanced template sandbox with', Object.keys(advancedSandbox).length, 'files');
  
  // Check if it has conditional logic
  const formComponent = advancedSandbox['/FormComponent.tsx'];
  if (formComponent && formComponent.code.includes('conditional:')) {
    console.log('   ✓ Advanced template contains conditional logic');
  } else {
    console.log('   ✗ Advanced template missing conditional logic');
  }
  
} catch (error) {
  console.log('   ✗ Error creating advanced template:', error.message);
}
console.log();

// Test 4: Check dependencies
console.log('4. Checking sandbox dependencies...');
try {
  const basicSandbox = createSandboxWithTemplate('basic');
  const packageJson = JSON.parse(basicSandbox['/package.json'].code);
  
  console.log('   Dependencies count:', Object.keys(packageJson.dependencies).length);
  console.log('   Has React:', !!packageJson.dependencies.react);
  console.log('   Has TanStack Form:', !!packageJson.dependencies['@tanstack/react-form']);
  console.log('   Has Zod:', !!packageJson.dependencies.zod);
  console.log('   Has Lucide React:', !!packageJson.dependencies['lucide-react']);
  
} catch (error) {
  console.log('   ✗ Error checking dependencies:', error.message);
}
console.log();

console.log('✓ Sandbox template testing complete!');
// Simple test to verify the parser works
import { FormedibleParser } from './index';

// Test basic JSON parsing
const jsonForm = `{
  "fields": [
    {
      "name": "firstName",
      "type": "text",
      "label": "First Name",
      "required": true
    },
    {
      "name": "age",
      "type": "number",
      "label": "Age",
      "min": 0,
      "max": 120
    }
  ]
}`;

// Test JavaScript object literal parsing
const jsForm = `{
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      validation: z.string().email()
    },
    {
      name: 'rating',
      type: 'rating',
      label: 'Rate our service',
      ratingConfig: {
        max: 5,
        allowHalf: true,
        icon: 'star'
      }
    }
  ]
}`;

// Test array and object field types
const complexForm = `{
  fields: [
    {
      name: 'person',
      type: 'object',
      label: 'Personal Information',
      objectConfig: {
        title: 'Personal Details',
        fields: [
          { name: 'name', type: 'text', label: 'Full Name' },
          { name: 'email', type: 'email', label: 'Email' }
        ]
      }
    },
    {
      name: 'hobbies',
      type: 'array',
      label: 'Hobbies',
      arrayConfig: {
        itemType: 'text',
        itemLabel: 'Hobby',
        minItems: 1,
        maxItems: 10
      }
    }
  ]
}`;

try {
  console.log('Testing JSON form parsing...');
  const parsedJson = FormedibleParser.parse(jsonForm);
  console.log('✅ JSON form parsed successfully');
  console.log(`Found ${parsedJson.fields.length} fields`);

  console.log('\nTesting JavaScript object literal parsing...');
  const parsedJs = FormedibleParser.parse(jsForm);
  console.log('✅ JavaScript form parsed successfully');
  console.log(`Found ${parsedJs.fields.length} fields`);

  console.log('\nTesting complex form with object and array fields...');
  const parsedComplex = FormedibleParser.parse(complexForm);
  console.log('✅ Complex form parsed successfully');
  console.log(`Found ${parsedComplex.fields.length} fields`);

  console.log('\nTesting field type validation...');
  console.log(`Supported field types: ${FormedibleParser.getSupportedFieldTypes().join(', ')}`);
  console.log(`Is 'text' a valid field type? ${FormedibleParser.isValidFieldType('text')}`);
  console.log(`Is 'invalid' a valid field type? ${FormedibleParser.isValidFieldType('invalid')}`);

  console.log('\n🎉 All tests passed! FormedibleParser is working correctly.');
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
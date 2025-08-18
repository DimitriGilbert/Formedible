import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { openaiCompatible } from '@ai-sdk/openai-compatible';

export async function POST(req: Request) {
  try {
    const { messages, provider, apiKey, endpoint } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    if (!provider) {
      return new Response('Provider not specified', { status: 400 });
    }

    let model;

    switch (provider) {
      case 'openai':
        if (!apiKey) return new Response('OpenAI API key required', { status: 400 });
        model = openai('gpt-4o', { apiKey });
        break;
      
      case 'anthropic':
        if (!apiKey) return new Response('Anthropic API key required', { status: 400 });
        model = anthropic('claude-3-5-sonnet-20241022', { apiKey });
        break;
      
      case 'google':
        if (!apiKey) return new Response('Google API key required', { status: 400 });
        model = google('gemini-1.5-pro', { apiKey });
        break;
      
      case 'mistral':
        if (!apiKey) return new Response('Mistral API key required', { status: 400 });
        model = mistral('mistral-large-latest', { apiKey });
        break;
      
      case 'openrouter':
        if (!apiKey) return new Response('OpenRouter API key required', { status: 400 });
        model = openrouter('meta-llama/llama-3.2-3b-instruct:free', {
          apiKey,
        });
        break;
      
      case 'openai-compatible':
        if (!endpoint) return new Response('Endpoint URL required for OpenAI-compatible providers', { status: 400 });
        model = openaiCompatible('gpt-3.5-turbo', {
          baseURL: endpoint,
          ...(apiKey && { apiKey }),
        });
        break;
      
      default:
        return new Response('Unsupported provider', { status: 400 });
    }

    const systemPrompt = `You are a helpful AI assistant that generates Formedible form configurations based on user descriptions.

When a user describes a form they want to create, respond with a JSON object that defines the form using the Formedible format.

Key guidelines:
1. Always respond with valid JSON only
2. Include a "fields" array with all the form fields
3. Each field must have: name, type, label
4. Use appropriate field types: text, email, password, tel, textarea, select, checkbox, switch, number, date, slider, file, rating, phone, colorPicker, location, duration, multiSelect, autocomplete, masked, object, array, radio
5. For select/radio/multiSelect fields, include an "options" array
6. Add validation where appropriate (required, min, max, etc.)
7. Include helpful descriptions and placeholders

Example response format:
{
  "fields": [
    {
      "name": "firstName",
      "type": "text",
      "label": "First Name",
      "placeholder": "Enter your first name",
      "required": true
    },
    {
      "name": "email",
      "type": "email", 
      "label": "Email Address",
      "placeholder": "your@email.com",
      "required": true
    }
  ]
}

Focus on creating practical, user-friendly forms based on the user's requirements.`;

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.parts?.map((part: any) => part.text).join('') || msg.content,
      })),
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
import type { AiPickerProviderConfig, AiPickerValues } from '@formedible/ui/components/formedible/ai-picker/lib/ai-picker-types';

export const defaultProviderConfigs: readonly AiPickerProviderConfig[] = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-5.4-mini', requiresKey: true },
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-sonnet-4-6', requiresKey: true },
  { value: 'openrouter', label: 'OpenRouter', defaultModel: 'minimax/minimax-m2.7', requiresKey: true },
] as const;

export const defaultPickerSchema = [
  {
    name: 'provider',
    type: 'select',
    label: 'Provider',
    required: true,
    options: defaultProviderConfigs.map((config) => ({ value: config.value, label: config.label })),
    defaultValue: 'openai' as const,
  },
  {
    name: 'apiKey',
    type: 'password',
    label: 'API key',
    placeholder: 'Provider API key',
    required: true,
  },
  {
    name: 'model',
    type: 'text',
    label: 'Model',
    required: true,
    placeholder: 'e.g. gpt-5.4-mini',
  },
  {
    name: 'temperature',
    type: 'number',
    label: 'Temperature',
    min: 0,
    max: 2,
    step: 0.1,
  },
  {
    name: 'maxTokens',
    type: 'number',
    label: 'Max tokens',
    min: 1,
    step: 1,
  },
  {
    name: 'thinkingBudgetTokens',
    type: 'number',
    label: 'Thinking budget tokens',
    description: 'Anthropic-only reasoning budget.',
    min: 1,
    step: 1,
    conditional: (values: AiPickerValues): boolean => values.provider === 'anthropic',
  },
  {
    name: 'storageMode',
    type: 'select',
    label: 'Key storage',
    required: true,
    options: [
      { value: 'memory', label: 'Memory only' },
      { value: 'session', label: 'Session storage' },
      { value: 'local', label: 'Local storage' },
    ],
    defaultValue: 'memory' as const,
  },
  {
    name: 'rememberKey',
    type: 'checkbox',
    label: 'Remember API key',
    conditional: (values: AiPickerValues): boolean => values.storageMode !== 'memory',
    disabled: false,
  },
] as const;

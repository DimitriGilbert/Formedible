import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchProviderModels, isRecentIsoTimestamp, isRecentUnixTimestamp } from '@/lib/formedible/ai-model-catalog';

const now = Date.parse('2026-05-15T00:00:00.000Z');

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

test('recent timestamp filters use the last six calendar months', () => {
  assert.equal(isRecentUnixTimestamp(Date.parse('2026-01-15T00:00:00.000Z') / 1000, now), true);
  assert.equal(isRecentUnixTimestamp(Date.parse('2025-10-31T00:00:00.000Z') / 1000, now), false);
  assert.equal(isRecentIsoTimestamp('2026-02-01T00:00:00.000Z', now), true);
  assert.equal(isRecentIsoTimestamp('2025-09-01T00:00:00.000Z', now), false);
});

test('OpenRouter model catalog fetches recent text output models', async () => {
  const requestedUrls: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    requestedUrls.push(String(input));

    return jsonResponse({
      data: [
        { id: 'minimax/minimax-2.7', name: 'MiniMax 2.7', created: Date.parse('2026-05-01T00:00:00.000Z') / 1000, architecture: { output_modalities: ['text'] }, context_length: 1_000_000, pricing: { prompt: '0.2', completion: '1.1' } },
        { id: 'old/model', name: 'Old model', created: Date.parse('2025-01-01T00:00:00.000Z') / 1000, architecture: { output_modalities: ['text'] } },
        { id: 'image/model', name: 'Image model', created: Date.parse('2026-05-01T00:00:00.000Z') / 1000, architecture: { output_modalities: ['image'] } },
      ],
    });
  };

  const catalog = await fetchProviderModels({ provider: 'openrouter', apiKey: 'openrouter-key', now, fetcher });

  assert.equal(requestedUrls[0], 'https://openrouter.ai/api/v1/models?output_modalities=text');
  assert.deepEqual(catalog.models.map((model) => model.id), ['minimax/minimax-2.7']);
  assert.equal(catalog.models[0]?.contextLength, 1_000_000);
  assert.equal(catalog.error, undefined);
});

test('OpenAI model catalog fetches recent models without pretending modality metadata exists', async () => {
  const fetcher: typeof fetch = async () => jsonResponse({
    data: [
      { id: 'gpt-5.4-mini', created: Date.parse('2026-04-01T00:00:00.000Z') / 1000, owned_by: 'openai' },
      { id: 'legacy-openai-model', created: Date.parse('2024-07-01T00:00:00.000Z') / 1000, owned_by: 'openai' },
    ],
  });

  const catalog = await fetchProviderModels({ provider: 'openai', apiKey: 'openai-key', now, fetcher });

  assert.deepEqual(catalog.models.map((model) => model.id), ['gpt-5.4-mini']);
  assert.equal(catalog.models[0]?.label, 'openai');
});

test('Anthropic model catalog follows pagination and filters release dates', async () => {
  const requestedUrls: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    requestedUrls.push(String(input));

    if (requestedUrls.length === 1) {
      return jsonResponse({
        data: [{ id: 'claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6', created_at: '2026-04-01T00:00:00.000Z', max_input_tokens: 200000 }],
        has_more: true,
        last_id: 'claude-sonnet-4-6',
      });
    }

    return jsonResponse({
      data: [{ id: 'claude-old', display_name: 'Claude Old', created_at: '2025-01-01T00:00:00.000Z' }],
      has_more: false,
    });
  };

  const catalog = await fetchProviderModels({ provider: 'anthropic', apiKey: 'anthropic-key', now, fetcher });

  assert.equal(requestedUrls.length, 2);
  assert.match(requestedUrls[1] ?? '', /after_id=claude-sonnet-4-6/);
  assert.deepEqual(catalog.models.map((model) => model.id), ['claude-sonnet-4-6']);
  assert.equal(catalog.models[0]?.contextLength, 200000);
});

test('model catalog fetch stores provider errors in the catalog shape', async () => {
  const fetcher: typeof fetch = async () => new Response('Nope', { status: 401 });
  const catalog = await fetchProviderModels({ provider: 'openai', apiKey: 'bad-key', now, fetcher });

  assert.equal(catalog.provider, 'openai');
  assert.deepEqual(catalog.models, []);
  assert.match(catalog.error ?? '', /HTTP 401/);
});

import { NextRequest, NextResponse } from "next/server";

interface ModelRequest {
  provider: string;
  apiKey: string;
  endpoint?: string;
}

// Mock model data - replace with actual API calls
const PROVIDER_MODELS: Record<string, string[]> = {
  openai: [
    "gpt-4o",
    "gpt-4o-mini", 
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo"
  ],
  anthropic: [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022", 
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307"
  ],
  google: [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-pro-vision"
  ],
  mistral: [
    "mistral-large-latest",
    "mistral-medium-latest", 
    "mistral-small-latest",
    "mistral-tiny"
  ],
  openrouter: [
    "meta-llama/llama-3.2-3b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "huggingface/zephyr-7b-beta:free"
  ]
};

export async function POST(request: NextRequest) {
  try {
    const body: ModelRequest = await request.json();
    const { provider, apiKey, endpoint } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    // For now, return mock data. In production, you would:
    // 1. Validate the API key by making a test request
    // 2. Fetch actual available models from the provider's API
    // 3. Handle rate limiting and errors appropriately

    let models: string[] = [];

    switch (provider) {
      case "openai":
        // In production: validate API key and fetch from OpenAI API
        if (!apiKey) {
          return NextResponse.json(
            { error: "API key required for OpenAI" },
            { status: 400 }
          );
        }
        models = PROVIDER_MODELS.openai;
        break;

      case "anthropic":
        if (!apiKey) {
          return NextResponse.json(
            { error: "API key required for Anthropic" },
            { status: 400 }
          );
        }
        models = PROVIDER_MODELS.anthropic;
        break;

      case "google":
        if (!apiKey) {
          return NextResponse.json(
            { error: "API key required for Google" },
            { status: 400 }
          );
        }
        models = PROVIDER_MODELS.google;
        break;

      case "mistral":
        if (!apiKey) {
          return NextResponse.json(
            { error: "API key required for Mistral" },
            { status: 400 }
          );
        }
        models = PROVIDER_MODELS.mistral;
        break;

      case "openrouter":
        if (!apiKey) {
          return NextResponse.json(
            { error: "API key required for OpenRouter" },
            { status: 400 }
          );
        }
        models = PROVIDER_MODELS.openrouter;
        break;

      case "openai-compatible":
        if (!endpoint) {
          return NextResponse.json(
            { error: "Endpoint URL required for OpenAI Compatible" },
            { status: 400 }
          );
        }
        // For custom endpoints, return a generic model list or fetch from the endpoint
        models = ["gpt-3.5-turbo", "gpt-4", "custom-model"];
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported provider" },
          { status: 400 }
        );
    }

    return NextResponse.json({ models });

  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
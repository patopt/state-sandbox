import { OpenAIProvider, getOpenAIModels } from './openai';
import { GeminiProvider, getGeminiModels } from './gemini';

export function getProvider(providerName, apiKey, models = {}) {
  const name = providerName || process.env.AI_PROVIDER || 'openai';
  if (name === 'gemini') {
    return new GeminiProvider(apiKey, models);
  }
  return new OpenAIProvider(apiKey, models);
}

export function getAllModels() {
  return {
    openai: getOpenAIModels(),
    gemini: getGeminiModels(),
  };
}

export function getProviderFromRequest(req) {
  // Read provider config from headers (set by client based on user settings)
  const provider = req.headers.get('x-ai-provider') || 'openai';
  const apiKey = req.headers.get('x-ai-api-key') || null;
  const modelHigh = req.headers.get('x-ai-model-high') || null;
  const modelMedium = req.headers.get('x-ai-model-medium') || null;
  const modelLow = req.headers.get('x-ai-model-low') || null;
  return getProvider(provider, apiKey, {
    high: modelHigh,
    medium: modelMedium,
    low: modelLow,
  });
}

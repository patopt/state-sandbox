import { GoogleGenerativeAI } from '@google/generative-ai';

// All Gemini models up to 3.1 pro preview
export const GEMINI_MODELS = {
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    description: 'Fast and efficient',
    tier: 'fast',
  },
  'gemini-2.0-flash-thinking-exp': {
    name: 'Gemini 2.0 Flash Thinking',
    description: 'Fast with reasoning',
    tier: 'fast',
  },
  'gemini-2.0-pro-exp': {
    name: 'Gemini 2.0 Pro',
    description: 'High capability',
    tier: 'pro',
  },
  'gemini-2.5-flash-preview-05-20': {
    name: 'Gemini 2.5 Flash Preview',
    description: 'Latest fast model',
    tier: 'fast',
  },
  'gemini-2.5-pro-preview-05-06': {
    name: 'Gemini 2.5 Pro Preview',
    description: 'Most capable reasoning',
    tier: 'pro',
  },
  'gemini-3.0-pro-preview': {
    name: 'Gemini 3.0 Pro Preview',
    description: 'Next generation pro',
    tier: 'pro',
  },
  'gemini-3.1-pro-preview': {
    name: 'Gemini 3.1 Pro Preview',
    description: 'Latest & most advanced',
    tier: 'pro',
  },
};

export function getGeminiModels() {
  return Object.entries(GEMINI_MODELS).map(([id, info]) => ({
    id,
    ...info,
    provider: 'gemini',
  }));
}

export class GeminiProvider {
  constructor(apiKey, models = {}) {
    const key = apiKey || process.env.GOOGLE_API_KEY;
    if (!key) throw new Error('Google API key is required for Gemini provider');
    this.genAI = new GoogleGenerativeAI(key);
    this.modelHigh = models.high || process.env.GEMINI_MODEL_HIGH || 'gemini-2.5-pro-preview-05-06';
    this.modelMedium = models.medium || process.env.GEMINI_MODEL_MEDIUM || 'gemini-2.0-pro-exp';
    this.modelLow = models.low || process.env.GEMINI_MODEL_LOW || 'gemini-2.0-flash';
  }

  async _generate(modelName, text) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });
      const result = await model.generateContent(text);
      const response = await result.response;
      return response.text();
    } catch (err) {
      // Fallback to flash if preview model not available
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        const fallback = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await fallback.generateContent(text);
        const response = await result.response;
        return response.text();
      }
      throw err;
    }
  }

  async generateHighReasoning(text) {
    return this._generate(this.modelHigh, text);
  }

  async generateMediumReasoning(text) {
    return this._generate(this.modelMedium, text);
  }

  async generateLowReasoning(text) {
    return this._generate(this.modelLow, text);
  }
}

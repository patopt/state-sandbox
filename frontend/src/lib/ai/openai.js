import OpenAI from 'openai';

const OPENAI_MODELS = {
  'gpt-4o': { name: 'GPT-4o', description: 'Fast and capable' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', description: 'Fastest, most affordable' },
  'o1': { name: 'o1', description: 'Advanced reasoning' },
  'o1-mini': { name: 'o1 Mini', description: 'Fast reasoning' },
  'o3-mini-2025-01-31': { name: 'o3 Mini', description: 'Best reasoning' },
  'o4-mini': { name: 'o4 Mini', description: 'Latest fast reasoning' },
};

export function getOpenAIModels() {
  return Object.entries(OPENAI_MODELS).map(([id, info]) => ({
    id,
    ...info,
    provider: 'openai',
  }));
}

export class OpenAIProvider {
  constructor(apiKey, models = {}) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.modelHigh = models.high || process.env.OPENAI_MODEL_HIGH || 'o3-mini-2025-01-31';
    this.modelMedium = models.medium || process.env.OPENAI_MODEL_MEDIUM || 'o3-mini-2025-01-31';
    this.modelLow = models.low || process.env.OPENAI_MODEL_LOW || 'gpt-4o';
  }

  async _generate(model, text, reasoningEffort = null) {
    const params = {
      model,
      messages: [{ role: 'user', content: text }],
    };
    if (reasoningEffort) {
      params.reasoning_effort = reasoningEffort;
    }
    const response = await this.client.chat.completions.create(params);
    return response.choices[0].message.content;
  }

  async generateHighReasoning(text) {
    return this._generate(this.modelHigh, text, 'medium');
  }

  async generateMediumReasoning(text) {
    return this._generate(this.modelMedium, text, 'medium');
  }

  async generateLowReasoning(text) {
    return this._generate(this.modelLow, text);
  }
}

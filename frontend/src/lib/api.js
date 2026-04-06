import { getAISettings } from '@/components/game/AISettingsModal';

// For Next.js API routes, use relative URLs
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const TOKEN_KEY = 'state-sandbox-token';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const aiSettings = typeof window !== 'undefined' ? getAISettings() : { provider: 'openai', model: '', apiKey: '' };

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Pass AI provider settings to API routes
    'x-ai-provider': aiSettings.provider || 'openai',
    ...(aiSettings.apiKey ? { 'x-ai-api-key': aiSettings.apiKey } : {}),
    ...(aiSettings.model ? {
      'x-ai-model-high': aiSettings.model,
      'x-ai-model-medium': aiSettings.model,
    } : {}),
  };
}

class ApiClient {
  async _post(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${res.statusText}`);
    }

    return res.json();
  }

  async _postStream(endpoint, data, onMessage) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            onMessage(event);
          } catch {
            // ignore malformed lines
          }
        }
      }
    }

    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer);
        onMessage(event);
      } catch {
        // ignore
      }
    }
  }

  async _get(endpoint, params) {
    const url = new URL(`${API_URL}${endpoint}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${res.statusText}`);
    }

    return res.json();
  }

  // Auth
  async getCurrentUser() {
    return this._get('/api/auth/me');
  }

  async emailLogin(email) {
    return this._post('/api/auth/login', { email });
  }

  // States
  async getStates() {
    return this._get('/api/states');
  }

  async getState(stateId) {
    return this._get(`/api/states/${stateId}`);
  }

  async getStateSnapshots(stateId) {
    return this._get(`/api/states/${stateId}/snapshots`);
  }

  async createState(name, questions, onMessage) {
    const aiSettings = typeof window !== 'undefined' ? getAISettings() : {};
    return this._postStream(
      '/api/states',
      { name, questions, aiProvider: aiSettings.provider, aiApiKey: aiSettings.apiKey },
      onMessage
    );
  }

  async createStateSnapshot(stateId, policy, onMessage) {
    return this._postStream(
      `/api/states/${stateId}/snapshots`,
      { policy },
      onMessage
    );
  }

  async getStateAdvice(stateId, question, events) {
    return this._post(`/api/states/${stateId}/advice`, {
      question,
      events: Array.isArray(events) ? events : (events || '').split('\n'),
    });
  }

  async getLatestSnapshots(valueKeys) {
    return this._get('/api/states/leaderboard', {
      valueKeys: Array.isArray(valueKeys) ? valueKeys.join(',') : valueKeys,
    });
  }
}

export const api = new ApiClient();

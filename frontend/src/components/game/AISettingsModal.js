'use client';

import { useState, useEffect } from 'react';
import { X, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', desc: 'Fast and capable' },
  { id: 'o1', name: 'o1', desc: 'Advanced reasoning' },
  { id: 'o3-mini-2025-01-31', name: 'o3-mini', desc: 'Best reasoning (recommended)' },
  { id: 'o4-mini', name: 'o4-mini', desc: 'Latest fast reasoning' },
];

const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Fast and efficient' },
  { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking', desc: 'Fast with reasoning' },
  { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro', desc: 'High capability' },
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview', desc: 'Latest fast model' },
  { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro Preview', desc: 'Most capable (recommended)' },
  { id: 'gemini-3.0-pro-preview', name: 'Gemini 3.0 Pro Preview', desc: 'Next generation pro' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', desc: 'Latest & most advanced' },
];

const AI_SETTINGS_KEY = 'state-sandbox-ai-settings';

export function getAISettings() {
  if (typeof window === 'undefined') return { provider: 'openai', model: 'o3-mini-2025-01-31', apiKey: '' };
  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : { provider: 'openai', model: 'o3-mini-2025-01-31', apiKey: '' };
  } catch {
    return { provider: 'openai', model: 'o3-mini-2025-01-31', apiKey: '' };
  }
}

export function saveAISettings(settings) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

export default function AISettingsModal({ onClose }) {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('o3-mini-2025-01-31');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const saved = getAISettings();
    setProvider(saved.provider || 'openai');
    setModel(saved.model || 'o3-mini-2025-01-31');
    setApiKey(saved.apiKey || '');
  }, []);

  const models = provider === 'openai' ? OPENAI_MODELS : GEMINI_MODELS;

  const handleSave = () => {
    saveAISettings({ provider, model, apiKey });
    onClose();
  };

  const handleProviderChange = (p) => {
    setProvider(p);
    setModel(p === 'openai' ? 'o3-mini-2025-01-31' : 'gemini-2.5-pro-preview-05-06');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">AI Provider Settings</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Provider selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">AI Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'openai', name: 'OpenAI', logo: '🤖' },
                { id: 'gemini', name: 'Google Gemini', logo: '✨' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border text-sm transition-all text-left',
                    provider === p.id
                      ? 'border-primary/50 bg-primary/10 text-foreground'
                      : 'border-white/10 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span className="text-xl">{p.logo}</span>
                  <span className="font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Model</label>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 appearance-none text-foreground"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-background">
                    {m.name} — {m.desc}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {provider === 'openai' ? 'OpenAI' : 'Google'} API Key
              <span className="text-xs ml-1 text-muted-foreground/60">(optional — uses server key if empty)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`sk-...`}
              className="w-full px-3 py-2.5 bg-secondary border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder-muted-foreground font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Gemini 3.1 Pro Preview</strong> offers the most advanced reasoning.
            Gemini 2.0 Flash is the fastest option for quick simulations.
            OpenAI o3-mini provides excellent reasoning for complex geopolitical scenarios.
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

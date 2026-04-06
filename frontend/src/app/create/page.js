'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2, Globe, ChevronRight, ChevronDown, Settings } from 'lucide-react';
import AISettingsModal from '@/components/game/AISettingsModal';

const QUESTIONS = [
  'Individual rights should take precedence over collective needs',
  'The state should have a strong role in economic affairs',
  'Scientific progress should be prioritized over traditional values',
  'International cooperation is more important than national sovereignty',
  'The state should promote traditional cultural values',
  'Economic inequality is acceptable for societal progress',
  'Personal freedom can be limited for social stability',
  'Economic growth should take priority over resource conservation',
  'The state should provide comprehensive social welfare',
  'Private enterprises should operate with minimal regulation',
  'Education should focus on practical skills over theoretical knowledge',
  'Healthcare should be market-driven rather than state-provided',
  'Citizens have a duty to serve their country',
  'Environmental protection should take priority over economic growth',
  'Society should be open to cultural change and immigration',
  'Religious values should guide public policy',
  'Justice should prioritize rehabilitation over punishment',
  'Technological innovation should be closely regulated',
  'Media should operate independently of government influence',
  'Power should be decentralized to local communities',
];

const RATINGS = [
  { value: 1, label: 'Strongly\nDisagree', shortLabel: 'SD', color: 'border-red-700 bg-red-900/30 text-red-300', activeColor: 'bg-red-700 border-red-600 text-white' },
  { value: 2, label: 'Disagree', shortLabel: 'D', color: 'border-orange-700 bg-orange-900/20 text-orange-300', activeColor: 'bg-orange-700 border-orange-600 text-white' },
  { value: 3, label: 'Neutral', shortLabel: 'N', color: 'border-slate-600 bg-slate-800/30 text-slate-300', activeColor: 'bg-slate-600 border-slate-500 text-white' },
  { value: 4, label: 'Agree', shortLabel: 'A', color: 'border-emerald-700 bg-emerald-900/20 text-emerald-300', activeColor: 'bg-emerald-700 border-emerald-600 text-white' },
  { value: 5, label: 'Strongly\nAgree', shortLabel: 'SA', color: 'border-green-600 bg-green-900/30 text-green-300', activeColor: 'bg-green-700 border-green-600 text-white' },
];

const LOADING_MESSAGES = [
  'Designing the flag...', 'Recruiting an army...', 'Establishing government...',
  'Writing the constitution...', 'Building infrastructure...', 'Training diplomats...',
  'Setting up the economy...', 'Founding the capital city...', 'Minting currency...',
  'Creating national parks...', 'Composing national anthem...', 'Drawing border lines...',
  'Building parliament...', 'Training civil servants...', 'Establishing courts...',
];

export default function CreatePage() {
  const router = useRouter();
  const { user, refreshStates } = useUser();
  const { toast } = useToast();
  const [ratings, setRatings] = useState({});
  const [countryName, setCountryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [shuffled] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5));

  const visibleQuestions = showAll ? shuffled : shuffled.slice(0, 7);

  const isValid = useMemo(
    () => countryName.trim() !== '' && Object.keys(ratings).length >= 5,
    [countryName, ratings]
  );

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsg((p) => (p + 1) % LOADING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setIsLoading(true);

    try {
      const questionData = visibleQuestions
        .map((q, i) => ({ question: q, value: parseInt(ratings[i] || 3) }))
        .filter((_, i) => ratings[i] !== undefined);

      let stateId = null;
      await api.createState(countryName, questionData, (event) => {
        switch (event.type) {
          case 'state_created':
            stateId = event.id;
            break;
          case 'error':
            toast({ variant: 'destructive', title: 'Error', description: event.message });
            if (event.message?.includes('credits')) {
              setTimeout(() => router.push('/account'), 2000);
            }
            break;
          case 'complete':
            refreshStates().then(() => {
              router.push(`/game/${stateId}`);
            });
            break;
        }
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create nation.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 lg:p-10 py-10">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold gradient-text mb-2">Found a Nation</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your political philosophy will shape your nation's government, economy, military, and culture.
              The AI will create a unique country tailored to your values.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Country name + AI settings */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Country Name <span className="text-muted-foreground text-xs">(AI may adapt it)</span>
                </label>
                <input
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder="e.g. Valdoria, Kharistan, Meridian..."
                  className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder-muted-foreground"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAISettings(true)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Configure AI Provider (OpenAI / Gemini)
              </button>
            </div>

            {/* Political questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Political Philosophy
                </h3>
                <span className="text-xs text-muted-foreground">
                  {Object.keys(ratings).length} / {visibleQuestions.length} answered
                </span>
              </div>

              {visibleQuestions.map((question, index) => (
                <div key={index} className="glass-panel rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    {index < 5 && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/30 flex-shrink-0 mt-0.5">
                        Required
                      </span>
                    )}
                    <p className="text-sm font-medium leading-snug">{question}</p>
                  </div>
                  <div className="flex gap-2">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRatings((p) => ({ ...p, [index]: r.value }))}
                        className={cn(
                          'flex-1 py-2 rounded-lg border text-[10px] font-medium transition-all text-center leading-tight',
                          ratings[index] === r.value ? r.activeColor : r.color
                        )}
                      >
                        <span className="hidden sm:block whitespace-pre-line">{r.label}</span>
                        <span className="sm:hidden">{r.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="w-full py-3 glass-panel rounded-xl text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors border border-white/10"
                >
                  <ChevronDown className="w-4 h-4" />
                  Show {QUESTIONS.length - 7} more optional questions
                </button>
              )}
            </div>

            {/* Submit */}
            {!isLoading ? (
              <button
                type="submit"
                disabled={!isValid}
                className={cn(
                  'w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                  isValid
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan'
                    : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-60'
                )}
              >
                <Globe className="w-4 h-4" />
                Create Nation
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="glass-panel rounded-xl p-6 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
                <div>
                  <p className="font-medium text-sm">Founding your nation...</p>
                  <p className="text-xs text-muted-foreground mt-1 animate-pulse">
                    {LOADING_MESSAGES[loadingMsg]}
                  </p>
                </div>
                <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
                  <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-cyan-950/10 to-background" />
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Globe className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10 glass-panel rounded-2xl p-6 w-full space-y-4">
          <h3 className="font-semibold text-sm gradient-text">What you'll control</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            {['People & Demographics', 'Economy & Trade', 'Military & Defense', 'Diplomacy & Foreign Relations',
              'Technology & Infrastructure', 'Government & Politics', 'Health & Education', 'Culture & Media',
              'Geography & Environment', 'Public Opinion'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] text-muted-foreground">
              Powered by OpenAI o3-mini / Gemini 2.5 Pro. Each turn simulates 1 year of history.
            </p>
          </div>
        </div>
      </div>

      {/* AI Settings Modal */}
      {showAISettings && <AISettingsModal onClose={() => setShowAISettings(false)} />}
    </div>
  );
}

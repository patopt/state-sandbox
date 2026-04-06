'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Globe, Shield, Zap } from 'lucide-react';

const FEATURES = [
  { icon: Globe, label: 'AI-Powered World Simulation', desc: 'OpenAI o3 + Gemini 2.5 Pro' },
  { icon: Shield, label: 'Command Armies & Navies', desc: 'Full military strategy & diplomacy' },
  { icon: Zap, label: 'Real Geopolitical Consequences', desc: 'Every decision shapes history' },
];

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/');
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send link');
      setSent(true);
      if (data.devToken) {
        router.push(`/auth/verify?token=${data.devToken}`);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="spinner-glow w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Auth form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text">State Sandbox</h1>
            <p className="text-muted-foreground mt-1 text-sm">AI-Powered Grand Strategy Simulation</p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-2.5 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : 'Send Magic Link'}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                No password needed. We'll send you a secure login link.
              </p>
            </form>
          ) : (
            <div className="glass-panel rounded-xl p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Check your inbox</h3>
              <p className="text-sm text-muted-foreground">
                Magic link sent to <span className="text-foreground">{email}</span>
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-primary hover:text-primary/80"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-purple-950/20 to-background" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md w-full space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-3">
              Rule a Nation.<br />
              <span className="gradient-text">Shape History.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Command a nation through political upheaval, economic crises, and military conflicts.
              Every decision cascades through 14 dimensions of your country.
            </p>
          </div>
          <div className="space-y-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Nations Created', value: '1,200+' },
              { label: 'Years Simulated', value: '8,500+' },
              { label: 'AI Decisions', value: '42k+' },
            ].map((stat, i) => (
              <div key={i} className="glass-panel rounded-xl p-3 text-center">
                <div className="text-lg font-bold gradient-text">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

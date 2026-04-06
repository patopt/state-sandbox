'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import {
  Globe, Shield, TrendingUp, Users, Cpu, Scroll, MessageCircle, Bot,
  ChevronRight, Loader2, Menu, X, Play, BarChart3, Map, Settings,
  Coins, Calendar, Flag, Zap
} from 'lucide-react';
import EventFeed from '@/components/game/EventFeed';
import MilitaryPanel from '@/components/game/MilitaryPanel';
import TechTree from '@/components/game/TechTree';
import AdvisorChat from '@/components/game/AdvisorChat';
import AISettingsModal from '@/components/game/AISettingsModal';
import { getAISettings } from '@/components/game/AISettingsModal';

// Dynamic imports for heavy components
const WorldMap = dynamic(() => import('@/components/game/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-background/50 rounded-xl">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  ),
});
const DiplomacyPanel = dynamic(() => import('@/components/game/DiplomacyPanel'), { ssr: false });

const SAMPLE_NATIONS = [
  { id: 1, name: 'Valorian Federation', coords: [15, 52], relation: 'neutral', power: 'medium' },
  { id: 2, name: 'Solarian Empire', coords: [45, 38], relation: 'rival', power: 'high' },
  { id: 3, name: 'Meridian Republic', coords: [-70, 0], relation: 'ally', power: 'medium' },
  { id: 4, name: 'Khorazar Khanate', coords: [65, 42], relation: 'neutral', power: 'low' },
  { id: 5, name: 'Thalassian Commonwealth', coords: [120, -25], relation: 'friendly', power: 'medium' },
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: Map },
  { id: 'events', label: 'Events', icon: Zap },
  { id: 'diplomacy', label: 'Diplomacy', icon: MessageCircle },
  { id: 'military', label: 'Military', icon: Shield },
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'advisor', label: 'Advisor', icon: Bot },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
];

function StatCard({ label, value, icon: Icon, color = 'text-primary' }) {
  return (
    <div className="glass-panel rounded-lg p-3 flex items-center gap-3">
      {Icon && <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />}
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="font-semibold text-sm truncate">{value || '—'}</div>
      </div>
    </div>
  );
}

function PolicyInput({ onSubmit, isLoading, events = [] }) {
  const [policy, setPolicy] = useState('');

  const handleSubmit = () => {
    onSubmit(policy);
    setPolicy('');
  };

  return (
    <div className="glass-panel rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scroll className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Enact Policy & Advance Year</span>
        </div>
      </div>

      <textarea
        value={policy}
        onChange={(e) => setPolicy(e.target.value)}
        placeholder="Describe your government's actions for this year... (e.g. 'Invest heavily in renewable energy infrastructure', 'Increase military spending by 15%', 'Open diplomatic talks with Solarian Empire')"
        className="w-full h-24 px-3 py-2.5 bg-background border border-white/10 rounded-lg text-sm resize-none focus:outline-none focus:border-primary/50 text-foreground placeholder-muted-foreground leading-relaxed"
      />

      <div className="flex items-center gap-3">
        <div className="flex-1 text-xs text-muted-foreground">
          {events.filter(e => e && !e.includes('No notable')).length > 0 && (
            <span className="text-yellow-400">⚠ {events.filter(e => e && !e.includes('No notable')).length} events to respond to</span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            isLoading
              ? 'bg-secondary text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan'
          )}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Simulating...</>
          ) : (
            <><Play className="w-4 h-4" /> Advance Year</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function GamePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [state, setState] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedNation, setSelectedNation] = useState(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [deltaReport, setDeltaReport] = useState('');
  const [showDelta, setShowDelta] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadState = useCallback(async () => {
    try {
      setIsLoading(true);
      const [stateData, snapshotData] = await Promise.all([
        api.getState(id),
        api.getStateSnapshots(id),
      ]);
      setState(stateData);
      setSnapshots(snapshotData);
      if (snapshotData.length > 0) {
        setCurrentSnapshot(snapshotData[0]); // Most recent first
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load state.' });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { loadState(); }, [loadState]);

  const handleAdvanceYear = async (policy) => {
    if (!user || isAdvancing) return;
    setIsAdvancing(true);
    setStatusMsg('Drafting policies...');
    setShowDelta(false);

    try {
      const aiSettings = getAISettings();
      await api.createStateSnapshot(id, policy, (event) => {
        switch (event.type) {
          case 'status':
            setStatusMsg(event.message);
            break;
          case 'snapshot_complete':
            const newSnapshot = event.snapshot;
            setSnapshots((prev) => [newSnapshot, ...prev]);
            setCurrentSnapshot(newSnapshot);
            setDeltaReport(newSnapshot.delta_report || '');
            setShowDelta(true);
            setStatusMsg('');
            break;
          case 'error':
            toast({ variant: 'destructive', title: 'Simulation Error', description: event.message });
            break;
        }
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to advance year.' });
    } finally {
      setIsAdvancing(false);
      setStatusMsg('');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="spinner-glow w-10 h-10" />
        <p className="text-muted-foreground text-sm">Loading your nation...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Nation not found.</p>
        <button onClick={() => router.push('/')} className="text-primary hover:underline text-sm">
          Go home
        </button>
      </div>
    );
  }

  const jsonState = currentSnapshot?.jsonState || {};
  const events = currentSnapshot?.events || [];
  const policySuggestions = currentSnapshot?.events_policy || [];

  // Extract key metrics
  const gdp = jsonState?.economy?.economic_metrics?.metrics?.gross_domestic_product_gdp
    || jsonState?.economy?.economic_metrics?.metrics?.['gross_domestic_product_(gdp)'];
  const population = jsonState?.people?.people_metrics?.metrics?.total_population;
  const happiness = jsonState?.people?.people_metrics?.metrics?.['gallup_world_happiness_score'];
  const approval = jsonState?.government?.government_metrics?.metrics?.['overall_head_of_stategovernment_approval_rating']
    || jsonState?.government?.government_metrics?.metrics?.overall_head_of_stategovernment_approval_rating;
  const gdpGrowth = jsonState?.economy?.economic_metrics?.metrics?.['gdp_annual_growth_rate'];
  const unemployment = jsonState?.economy?.economic_metrics?.metrics?.unemployment_rate;
  const activeMilitary = jsonState?.defense?.military_personnel?.metrics?.['active_duty_personnel'];
  const nukes = jsonState?.defense?.military_assets?.metrics?.['strategic_nuclear_warheads'];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex-shrink-0 glass-panel border-b border-white/10 px-4 py-2.5 flex items-center gap-3 z-30">
        {/* Flag + name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            ←
          </button>
          {state.flagSvg && (
            <div
              className="w-10 h-7 rounded overflow-hidden border border-white/20 flex-shrink-0"
              dangerouslySetInnerHTML={{ __html: state.flagSvg }}
              style={{ transform: 'scale(0.95)' }}
            />
          )}
          <div>
            <div className="font-semibold text-sm leading-tight">{state.name}</div>
            <div className="text-[10px] text-muted-foreground">{currentSnapshot?.date || state.date}</div>
          </div>
        </div>

        {/* Key metrics bar */}
        <div className="hidden md:flex items-center gap-3 flex-1 overflow-x-auto px-4">
          {[
            { label: 'GDP', value: gdp, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Population', value: population, icon: Users, color: 'text-blue-400' },
            { label: 'Happiness', value: happiness, icon: null, color: 'text-yellow-400', prefix: '😊 ' },
            { label: 'Growth', value: gdpGrowth, color: 'text-emerald-400' },
            { label: 'Unemployment', value: unemployment, color: 'text-orange-400' },
            { label: 'Military', value: activeMilitary, icon: Shield, color: 'text-red-400' },
          ].map((m, i) => m.value && (
            <div key={i} className="flex items-center gap-1.5 text-xs flex-shrink-0">
              {m.icon && <m.icon className={cn('w-3 h-3', m.color)} />}
              <span className="text-muted-foreground">{m.label}:</span>
              <span className={cn('font-medium', m.color)}>{m.prefix}{m.value}</span>
            </div>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 border border-white/10 text-xs">
            <Coins className="w-3.5 h-3.5 text-gold" />
            <span className="text-muted-foreground">Credits:</span>
            <span className="font-semibold text-foreground">{user?.credits ?? '—'}</span>
          </div>
          <button
            onClick={() => setShowAISettings(true)}
            className="p-2 rounded-lg border border-white/10 bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            title="AI Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            className="md:hidden p-2 rounded-lg border border-white/10 bg-secondary/50 text-muted-foreground"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Tabs */}
        <aside className={cn(
          'flex-shrink-0 w-full md:w-52 lg:w-56 border-r border-white/10 flex flex-col overflow-y-auto z-20',
          'absolute inset-0 md:relative md:block',
          mobileMenuOpen ? 'block bg-background' : 'hidden md:block'
        )}>
          <nav className="p-2 space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left',
                    activeTab === tab.id
                      ? 'bg-primary/15 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Snapshot history */}
          <div className="mt-auto p-3 border-t border-white/10">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> History
            </div>
            <div className="space-y-1">
              {snapshots.slice(0, 6).map((s, i) => (
                <button
                  key={s.id || i}
                  onClick={() => setCurrentSnapshot(s)}
                  className={cn(
                    'w-full text-left px-2 py-1 rounded text-xs transition-colors',
                    currentSnapshot?.id === s.id
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  {s.date}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Status message */}
          {(isAdvancing || statusMsg) && (
            <div className="flex-shrink-0 px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2 text-sm text-primary">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              {statusMsg || 'Processing...'}
            </div>
          )}

          {/* Delta report banner */}
          {showDelta && deltaReport && (
            <div className="flex-shrink-0 m-4 glass-panel rounded-xl overflow-hidden border border-green-500/20">
              <div className="bg-green-500/10 px-4 py-2 flex items-center justify-between border-b border-green-500/20">
                <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                  <Zap className="w-4 h-4" />
                  Year Complete — Executive Report
                </div>
                <button
                  onClick={() => setShowDelta(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <ReactMarkdown
                  className="prose prose-sm prose-invert max-w-none text-sm"
                  components={{
                    h3: ({ children }) => <h3 className="text-base font-bold text-foreground mb-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-1.5 text-muted-foreground">{children}</p>,
                    strong: ({ children }) => <strong className="text-foreground">{children}</strong>,
                    li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                  }}
                >
                  {deltaReport}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Tab content */}
          <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
            {activeTab === 'overview' && (
              <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
                {/* Map */}
                <div className="flex-1 min-h-[300px] lg:min-h-0">
                  <WorldMap
                    playerNation={{ name: state.name, capital: { coords: [0, 30] } }}
                    nations={SAMPLE_NATIONS}
                    selectedNation={selectedNation}
                    onSelectNation={(n) => {
                      setSelectedNation(n);
                      setActiveTab('diplomacy');
                    }}
                  />
                </div>

                {/* Right column */}
                <div className="lg:w-80 flex flex-col gap-4">
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'GDP', value: gdp, icon: TrendingUp, color: 'text-green-400' },
                      { label: 'Population', value: population, icon: Users, color: 'text-blue-400' },
                      { label: 'Happiness', value: happiness, color: 'text-yellow-400' },
                      { label: 'Approval', value: approval, color: 'text-purple-400' },
                    ].map((s, i) => (
                      <StatCard key={i} {...s} />
                    ))}
                  </div>

                  {/* Events */}
                  <div className="flex-1 overflow-hidden">
                    <EventFeed
                      events={events}
                      policySuggestions={policySuggestions}
                      currentDate={currentSnapshot?.date}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="flex-1 overflow-hidden">
                <EventFeed
                  events={events}
                  policySuggestions={policySuggestions}
                  currentDate={currentSnapshot?.date}
                />
              </div>
            )}

            {activeTab === 'diplomacy' && (
              <div className="flex-1 overflow-hidden glass-panel rounded-xl">
                <DiplomacyPanel
                  nations={SAMPLE_NATIONS}
                  playerNation={{ name: state.name }}
                  selectedNation={selectedNation}
                  onSelectNation={setSelectedNation}
                />
              </div>
            )}

            {activeTab === 'military' && (
              <div className="flex-1 overflow-y-auto">
                <MilitaryPanel
                  defenseData={jsonState?.defense}
                  personnelData={jsonState?.defense?.military_personnel}
                />
              </div>
            )}

            {activeTab === 'technology' && (
              <div className="flex-1 overflow-hidden">
                <TechTree techData={jsonState?.infrastructure_and_technology} />
              </div>
            )}

            {activeTab === 'advisor' && (
              <div className="flex-1 overflow-hidden glass-panel rounded-xl">
                <AdvisorChat stateId={id} events={events} />
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="flex-1 overflow-y-auto">
                <StatsTab jsonState={jsonState} />
              </div>
            )}

            {/* Policy input - shown on overview and events */}
            {(activeTab === 'overview' || activeTab === 'events') && (
              <PolicyInput
                onSubmit={handleAdvanceYear}
                isLoading={isAdvancing}
                events={events}
              />
            )}
          </div>
        </main>
      </div>

      {showAISettings && <AISettingsModal onClose={() => setShowAISettings(false)} />}
    </div>
  );
}

function StatsTab({ jsonState }) {
  if (!jsonState || Object.keys(jsonState).length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
        No statistics available yet
      </div>
    );
  }

  const sections = [
    { key: 'people', label: 'People', subKey: 'people_metrics' },
    { key: 'economy', label: 'Economy', subKey: 'economic_metrics' },
    { key: 'health', label: 'Health', subKey: 'health_metrics' },
    { key: 'crime', label: 'Crime', subKey: 'crime_metrics' },
    { key: 'government', label: 'Government', subKey: 'government_metrics' },
    { key: 'education', label: 'Education', subKey: 'education_metrics' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sections.map(({ key, label, subKey }) => {
        const section = jsonState[key];
        if (!section) return null;
        const metricsSection = section[subKey];
        if (!metricsSection?.metrics) return null;

        return (
          <div key={key} className="glass-panel rounded-xl p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">{label}</h3>
            <div className="space-y-2">
              {Object.entries(metricsSection.metrics)
                .filter(([, v]) => v && v !== '—')
                .slice(0, 8)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start gap-2 text-xs">
                    <span className="text-muted-foreground capitalize leading-relaxed">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className="text-foreground font-medium text-right">{v}</span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

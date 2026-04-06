'use client';

import { useState } from 'react';
import { gameApi } from '@/lib/game-api';
import { useToast } from '@/hooks/use-toast';

const ERA_ORDER = ['ancient', 'medieval', 'gunpowder', 'industrial', 'modern', 'digital'];
const ERA_COLORS_BG = {
  ancient: '#78350f',
  medieval: '#7c2d12',
  gunpowder: '#7f1d1d',
  industrial: '#1e3a5f',
  modern: '#1e3a8a',
  digital: '#4c1d95',
};
const ERA_COLORS_LIGHT = {
  ancient: '#fef3c7',
  medieval: '#ffedd5',
  gunpowder: '#fee2e2',
  industrial: '#dbeafe',
  modern: '#e0e7ff',
  digital: '#ede9fe',
};

function TechCard({ techId, tech, status, onResearch, loading, gold }) {
  const canResearch = status === 'available' && gold >= tech.cost;
  const isResearched = status === 'researched';
  const isLocked = status === 'locked';
  const isResearching = loading === techId;

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        isResearched
          ? 'border-green-500/50 bg-green-500/5'
          : canResearch
          ? 'border-primary/50 bg-card hover:border-primary cursor-pointer'
          : isLocked
          ? 'opacity-40 bg-muted/30'
          : 'border-orange-400/50 bg-orange-50/5'
      }`}
      onClick={() => canResearch && onResearch(techId)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-semibold text-sm leading-tight">{tech.name}</div>
        <div className="flex items-center gap-1 shrink-0">
          {isResearched && <span className="text-green-500 text-sm">✓</span>}
          {isLocked && <span className="text-muted-foreground text-sm">🔒</span>}
          {(status === 'available') && <span className="text-primary text-sm">🔬</span>}
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-2 leading-relaxed">{tech.description}</div>

      {tech.bonus && (
        <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded px-1.5 py-0.5 mb-2">
          ✨ {tech.bonus}
        </div>
      )}

      {tech.unlocks_units?.length > 0 && (
        <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
          🪖 Unlocks: {tech.unlocks_units.join(', ')}
        </div>
      )}

      {tech.requires?.length > 0 && !isResearched && (
        <div className="text-xs text-muted-foreground mb-1">
          📋 Requires: {tech.requires.join(', ')}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs font-medium ${isResearched ? 'text-muted-foreground line-through' : 'text-yellow-600 dark:text-yellow-400'}`}>
          💰 {tech.cost} gold
        </span>
        {canResearch && !isResearching && (
          <span className="text-xs text-primary font-medium">Click to research →</span>
        )}
        {isResearching && (
          <span className="text-xs text-muted-foreground animate-pulse">Researching…</span>
        )}
        {!canResearch && !isResearched && status === 'available' && (
          <span className="text-xs text-red-500">Not enough gold</span>
        )}
      </div>
    </div>
  );
}

function EraProgress({ era, techs, researched }) {
  const total = techs.length;
  const done = techs.filter((id) => researched[id]?.researched).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground capitalize w-20">{era}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-muted-foreground w-12 text-right">{done}/{total}</span>
    </div>
  );
}

export default function TechTree({ stateId, gameState, onRefresh }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(null);
  const [filter, setFilter] = useState('all');

  const config = gameState?.config || {};
  const technologies = config.technologies || {};
  const researched = gameState?.researched_techs || {};
  const gold = gameState?.gold || 0;

  const getTechStatus = (techId, tech) => {
    if (researched[techId]?.researched) return 'researched';
    const prereqsMet = (tech.requires || []).every((r) => researched[r]?.researched);
    if (!prereqsMet) return 'locked';
    return 'available';
  };

  const handleResearch = async (techId) => {
    setLoading(techId);
    try {
      const result = await gameApi.researchTech(stateId, techId);
      toast({
        title: `✅ ${result.tech_name} researched!`,
        description: result.unlocks_units?.length
          ? `Unlocked: ${result.unlocks_units.join(', ')}`
          : `Gold remaining: ${result.gold}`,
        duration: 4000,
      });
      onRefresh?.();
    } catch (err) {
      toast({ title: 'Research failed', description: err.message, variant: 'destructive', duration: 3000 });
    } finally {
      setLoading(null);
    }
  };

  const byEra = ERA_ORDER.reduce((acc, era) => {
    acc[era] = Object.entries(technologies).filter(([, t]) => t.era === era);
    return acc;
  }, {});

  const counts = {
    all: Object.keys(technologies).length,
    researched: Object.values(technologies).filter((_, i) => {
      const id = Object.keys(technologies)[i];
      return researched[id]?.researched;
    }).length,
    available: Object.entries(technologies).filter(([id, t]) => getTechStatus(id, t) === 'available').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {[['all', `All (${counts.all})`], ['available', `Available (${counts.available})`], ['researched', `Researched (${counts.researched})`]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${filter === id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-primary/30'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">💰 {gold.toLocaleString()} gold</div>
      </div>

      <div className="space-y-2 bg-muted/30 rounded-lg p-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Era Progress</div>
        {ERA_ORDER.map((era) => (
          <EraProgress
            key={era}
            era={era}
            techs={(byEra[era] || []).map(([id]) => id)}
            researched={researched}
          />
        ))}
      </div>

      {ERA_ORDER.map((era) => {
        const eraTechs = byEra[era] || [];
        const visible = eraTechs.filter(([id, tech]) => {
          const status = getTechStatus(id, tech);
          if (filter === 'researched') return status === 'researched';
          if (filter === 'available') return status === 'available';
          return true;
        });
        if (visible.length === 0) return null;

        return (
          <div key={era} className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white"
                style={{ background: ERA_COLORS_BG[era] }}
              >
                {era} era
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map(([id, tech]) => (
                <TechCard
                  key={id}
                  techId={id}
                  tech={tech}
                  status={getTechStatus(id, tech)}
                  onResearch={handleResearch}
                  loading={loading}
                  gold={gold}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

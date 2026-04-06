'use client';

import { useState } from 'react';
import { Shield, Plane, Anchor, Cpu, Crosshair, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MILITARY_CATEGORIES = [
  {
    id: 'air',
    label: 'Air Force',
    icon: Plane,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
  },
  {
    id: 'naval',
    label: 'Navy',
    icon: Anchor,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'ground',
    label: 'Army',
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
  },
  {
    id: 'cyber',
    label: 'Cyber & Intel',
    icon: Cpu,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'nuclear',
    label: 'Strategic',
    icon: Crosshair,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
  },
];

function parseDefenseData(defenseText) {
  if (!defenseText) return {};
  const assets = {};
  const lines = defenseText.split('\n');
  for (const line of lines) {
    const match = line.match(/^-\s+([^:]+):\s*(.+)$/);
    if (match) {
      assets[match[1].trim()] = match[2].trim();
    }
  }
  return assets;
}

function categorizeAssets(assets) {
  const air = {};
  const naval = {};
  const ground = {};
  const cyber = {};
  const nuclear = {};

  for (const [key, value] of Object.entries(assets)) {
    const k = key.toLowerCase();
    if (k.includes('aircraft') || k.includes('helicopter') || k.includes('drone') || k.includes('aerial') || k.includes('air')) {
      air[key] = value;
    } else if (k.includes('ship') || k.includes('submarine') || k.includes('naval') || k.includes('vessel')) {
      naval[key] = value;
    } else if (k.includes('tank') || k.includes('armored') || k.includes('artillery') || k.includes('infantry') || k.includes('personnel') || k.includes('missile')) {
      ground[key] = value;
    } else if (k.includes('cyber') || k.includes('electronic') || k.includes('satellite') || k.includes('intel')) {
      cyber[key] = value;
    } else if (k.includes('nuclear') || k.includes('warhead') || k.includes('icbm') || k.includes('slbm') || k.includes('delivery')) {
      nuclear[key] = value;
    } else {
      ground[key] = value;
    }
  }

  return { air, naval, ground, cyber, nuclear };
}

function AssetRow({ label, value }) {
  const numVal = parseInt(value?.replace(/[^0-9]/g, '')) || 0;
  const isZero = numVal === 0 || value === '0';

  return (
    <div className={cn('flex items-center justify-between py-1.5 text-xs border-b border-white/5 last:border-0', isZero && 'opacity-40')}>
      <span className="text-muted-foreground truncate pr-2">{label}</span>
      <span className={cn('font-mono font-medium flex-shrink-0', !isZero ? 'text-foreground' : 'text-muted-foreground')}>
        {value || '0'}
      </span>
    </div>
  );
}

export default function MilitaryPanel({ defenseData, personnelData }) {
  const [activeCategory, setActiveCategory] = useState('ground');

  // Parse defense markdown into structured data
  const rawAssets = {};
  if (defenseData?.military_assets?.metrics) {
    Object.assign(rawAssets, defenseData.military_assets.metrics);
  }
  if (defenseData?.military_personnel?.metrics) {
    Object.assign(rawAssets, defenseData.military_personnel.metrics);
  }

  const categorized = categorizeAssets(rawAssets);
  const activeAssets = categorized[activeCategory] || {};

  // Military strength score (simplified)
  const totalAssets = Object.values(rawAssets).reduce((sum, v) => {
    const n = parseInt(v?.replace(/[^0-9]/g, '')) || 0;
    return sum + n;
  }, 0);

  const activePersonnel = rawAssets['Active Duty Personnel'] || rawAssets['active_duty_personnel'] || '0';
  const reservePersonnel = rawAssets['Reserve Personnel'] || rawAssets['reserve_personnel'] || '0';

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Personnel overview */}
      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" />
          Military Forces
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-400 font-mono">{activePersonnel}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Active Duty</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-400 font-mono">{reservePersonnel}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Reserve Forces</div>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="glass-panel rounded-xl p-3 flex gap-1.5 overflow-x-auto">
        {MILITARY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = Object.keys(categorized[cat.id] || {}).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg border text-[10px] transition-all',
                activeCategory === cat.id
                  ? cn(cat.bgColor, 'border-opacity-60')
                  : 'border-white/10 hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-4 h-4', activeCategory === cat.id ? cat.color : '')} />
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={cn('px-1 rounded text-[9px]', cat.color)}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Assets list */}
      <div className="glass-panel rounded-xl p-4 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {MILITARY_CATEGORIES.find((c) => c.id === activeCategory)?.label} Assets
        </div>

        {Object.keys(activeAssets).length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-6">
            <div className="text-2xl mb-2">🏳</div>
            No data available
          </div>
        ) : (
          <div>
            {Object.entries(activeAssets).map(([key, value]) => (
              <AssetRow key={key} label={key} value={value} />
            ))}
          </div>
        )}
      </div>

      {/* Military challenges */}
      {defenseData?.top_defense_challenges?.text && (
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Defense Challenges
          </div>
          <div className="space-y-1.5">
            {defenseData.top_defense_challenges.text
              .split('\n')
              .filter((l) => l.trim().startsWith('-'))
              .slice(0, 3)
              .map((challenge, i) => {
                const [title, ...desc] = challenge.replace(/^-\s*/, '').split(':');
                return (
                  <div key={i} className="flex gap-2 text-xs">
                    <ChevronRight className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-orange-300 font-medium">{title}</span>
                      {desc.length > 0 && (
                        <span className="text-muted-foreground">: {desc.join(':')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

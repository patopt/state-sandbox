'use client';

import { useState } from 'react';
import { gameApi } from '@/lib/game-api';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG = {
  allied: { color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/30', label: 'Allied', icon: '🤝' },
  friendly: { color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30', label: 'Friendly', icon: '😊' },
  neutral: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', label: 'Neutral', icon: '😐' },
  cold: { color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Cold', icon: '🥶' },
  hostile: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', label: 'Hostile', icon: '😠' },
};

const PERSONALITY_ICONS = {
  aggressive: '⚔️',
  diplomatic: '🕊️',
  expansionist: '🗺️',
  peaceful: '🌿',
  militaristic: '🪖',
  scientific: '🔬',
  industrial: '⚙️',
  cultural: '🎭',
};

function RelationBar({ score }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : score >= 20 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium w-8 text-right">{score}</span>
    </div>
  );
}

function CountryCard({ relation, aiData, stateId, gold, onRefresh }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(null);

  const status = relation.status || 'neutral';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.neutral;
  const personality = aiData?.personality;

  const doAction = async (action) => {
    setLoading(action);
    try {
      const result = await gameApi.diplomacyAction(stateId, relation.ai_country_id, action);
      toast({ title: result.message, duration: 3000 });
      onRefresh?.();
    } catch (err) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive', duration: 3000 });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${statusCfg.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: aiData?.flag_color || '#6b7280' }}>
            {relation.ai_country_name.slice(0, 1)}
          </div>
          <div>
            <div className="font-semibold">{relation.ai_country_name}</div>
            {personality && (
              <div className="text-xs text-muted-foreground capitalize">
                {PERSONALITY_ICONS[personality] || '🌍'} {personality}
              </div>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm ${statusCfg.color}`}>
          <span>{statusCfg.icon}</span>
          <span className="font-medium">{statusCfg.label}</span>
        </div>
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1">Relations</div>
        <RelationBar score={relation.relation_score} />
      </div>

      {relation.trade_active && (
        <div className="text-xs bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded px-2 py-1">
          📦 Active trade agreement (+50 gold/turn)
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          disabled={loading === 'gift'}
          onClick={() => doAction('gift')}
          className="text-xs px-2.5 py-1.5 rounded border bg-card hover:bg-muted transition-colors disabled:opacity-50"
          title="Send 200 gold as a gift to improve relations"
        >
          🎁 Gift (💰200)
        </button>
        <button
          disabled={loading === 'trade' || (relation.relation_score < 40 && !relation.trade_active)}
          onClick={() => doAction('trade')}
          className={`text-xs px-2.5 py-1.5 rounded border transition-colors disabled:opacity-50 ${relation.trade_active ? 'bg-red-100 dark:bg-red-900/20 border-red-300 hover:bg-red-200' : 'bg-card hover:bg-muted'}`}
          title={relation.trade_active ? 'Cancel trade agreement' : 'Propose trade agreement (needs 40+ relations)'}
        >
          {relation.trade_active ? '❌ Cancel Trade' : '📦 Trade'}
        </button>
        <button
          disabled={loading === 'alliance' || relation.relation_score < 70 || relation.status === 'allied'}
          onClick={() => doAction('alliance')}
          className="text-xs px-2.5 py-1.5 rounded border bg-card hover:bg-muted transition-colors disabled:opacity-50"
          title="Form an alliance (needs 70+ relations)"
        >
          🤝 Alliance
        </button>
        <button
          disabled={loading === 'denounce'}
          onClick={() => doAction('denounce')}
          className="text-xs px-2.5 py-1.5 rounded border bg-red-100 dark:bg-red-900/20 border-red-300 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 transition-colors disabled:opacity-50"
          title="Denounce this country (-20 relations, ends trade)"
        >
          📣 Denounce
        </button>
      </div>
    </div>
  );
}

export default function Diplomacy({ stateId, gameState, onRefresh }) {
  const diplomacy = gameState?.diplomacy || [];
  const aiCountries = gameState?.map_data?.ai_countries || [];
  const gold = gameState?.gold || 0;

  const alliedCount = diplomacy.filter((d) => d.status === 'allied').length;
  const tradeCount = diplomacy.filter((d) => d.trade_active).length;
  const hostileCount = diplomacy.filter((d) => d.status === 'hostile').length;
  const tradeIncome = tradeCount * 50;

  const getAiData = (aiCountryId) => aiCountries.find((c) => c.id === aiCountryId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-500">{alliedCount}</div>
          <div className="text-xs text-muted-foreground">Allies</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-green-500">+{tradeIncome}</div>
          <div className="text-xs text-muted-foreground">Trade Income/Turn</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-red-500">{hostileCount}</div>
          <div className="text-xs text-muted-foreground">Hostile Nations</div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/30 rounded p-3">
        <strong>Diplomacy Tips:</strong> Send gifts to improve relations, establish trade for passive income (+50/turn), form alliances for military support, and avoid denouncing without reason.
        Relation score ≥ 40 for trade · ≥ 70 for alliance.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {diplomacy.map((rel) => (
          <CountryCard
            key={rel.ai_country_id}
            relation={rel}
            aiData={getAiData(rel.ai_country_id)}
            stateId={stateId}
            gold={gold}
            onRefresh={onRefresh}
          />
        ))}
        {diplomacy.length === 0 && (
          <div className="col-span-2 text-sm text-muted-foreground bg-muted rounded p-4 text-center">
            No neighboring countries discovered yet. Explore the world map to encounter other nations.
          </div>
        )}
      </div>
    </div>
  );
}

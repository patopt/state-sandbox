'use client';

import { useCallback, useEffect, useState } from 'react';
import { gameApi } from '@/lib/game-api';
import { useToast } from '@/hooks/use-toast';
import WorldMap from './WorldMap';
import MilitaryCommand from './MilitaryCommand';
import CityBuilder from './CityBuilder';
import TechTree from './TechTree';
import Diplomacy from './Diplomacy';

const TABS = [
  { id: 'map', label: '🗺️ World Map' },
  { id: 'military', label: '⚔️ Military' },
  { id: 'city', label: '🏙️ City Builder' },
  { id: 'tech', label: '🔬 Tech Lab' },
  { id: 'diplomacy', label: '🤝 Diplomacy' },
];

function TurnSummaryToast({ result }) {
  return (
    <div className="space-y-1 text-sm">
      <div>Turn {result.game_turn} complete</div>
      <div className="text-green-400">💰 +{result.income_this_turn?.toLocaleString()} gold</div>
      {result.city_income > 0 && <div className="text-xs text-muted-foreground">🏙️ Cities: +{result.city_income}</div>}
      {result.trade_income > 0 && <div className="text-xs text-muted-foreground">📦 Trade: +{result.trade_income}</div>}
    </div>
  );
}

export default function GameHub({ stateId }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('map');
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [endingTurn, setEndingTurn] = useState(false);

  const fetchGameState = useCallback(async () => {
    try {
      const data = await gameApi.getGameState(stateId);
      setGameState(data);
    } catch (err) {
      toast({ title: 'Failed to load game state', description: err.message, variant: 'destructive', duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, [stateId, toast]);

  useEffect(() => {
    fetchGameState();
  }, [fetchGameState]);

  const handleEndTurn = async () => {
    setEndingTurn(true);
    try {
      const result = await gameApi.endTurn(stateId);
      toast({
        title: `⏩ Turn ${result.game_turn} Complete`,
        description: `💰 +${result.income_this_turn?.toLocaleString()} gold earned this turn`,
        duration: 4000,
      });
      await fetchGameState();
    } catch (err) {
      toast({ title: 'End turn failed', description: err.message, variant: 'destructive', duration: 3000 });
    } finally {
      setEndingTurn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🌍</div>
          <div className="text-sm text-muted-foreground animate-pulse">Generating world map…</div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Could not load game state. Make sure the backend is running.
      </div>
    );
  }

  const activeUnits = (gameState.military_units || []).filter((u) => u.status !== 'destroyed');
  const cities = gameState.cities || [];
  const researchedCount = Object.values(gameState.researched_techs || {}).filter((t) => t.researched).length;
  const totalTechs = Object.keys(gameState.config?.technologies || {}).length;
  const alliedCount = (gameState.diplomacy || []).filter((d) => d.status === 'allied').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <div>
              <div className="font-bold">{gameState.state_name}</div>
              <div className="text-xs text-muted-foreground">Turn {gameState.game_turn}</div>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">💰</span>
              <span className="font-semibold">{gameState.gold?.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">gold</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚙️</span>
              <span className="font-semibold">{gameState.production}</span>
              <span className="text-xs text-muted-foreground">prod/turn</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🪖</span>
              <span className="font-semibold">{activeUnits.length}</span>
              <span className="text-xs text-muted-foreground">units</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔬</span>
              <span className="font-semibold">{researchedCount}/{totalTechs}</span>
              <span className="text-xs text-muted-foreground">techs</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🤝</span>
              <span className="font-semibold">{alliedCount}</span>
              <span className="text-xs text-muted-foreground">allies</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleEndTurn}
          disabled={endingTurn}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-2"
        >
          {endingTurn ? (
            <>
              <span className="animate-spin">⏳</span> Processing…
            </>
          ) : (
            <>⏩ End Turn</>
          )}
        </button>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors -mb-px font-medium ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'map' && (
          <WorldMap stateId={stateId} gameState={gameState} onRefresh={fetchGameState} />
        )}
        {activeTab === 'military' && (
          <MilitaryCommand stateId={stateId} gameState={gameState} onRefresh={fetchGameState} />
        )}
        {activeTab === 'city' && (
          <CityBuilder stateId={stateId} gameState={gameState} onRefresh={fetchGameState} />
        )}
        {activeTab === 'tech' && (
          <TechTree stateId={stateId} gameState={gameState} onRefresh={fetchGameState} />
        )}
        {activeTab === 'diplomacy' && (
          <Diplomacy stateId={stateId} gameState={gameState} onRefresh={fetchGameState} />
        )}
      </div>
    </div>
  );
}

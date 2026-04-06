'use client';

import { useState } from 'react';
import { gameApi } from '@/lib/game-api';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_ICONS = { land: '🪖', air: '✈️', naval: '⚓' };
const ERA_ORDER = ['ancient', 'medieval', 'gunpowder', 'modern', 'digital'];
const ERA_COLORS = {
  ancient: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  medieval: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
  gunpowder: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  modern: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  digital: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300',
};

function UnitCard({ unit, onDisband, isOwn }) {
  const healthColor = unit.health > 66 ? 'bg-green-500' : unit.health > 33 ? 'bg-yellow-500' : 'bg-red-500';
  const expStars = Math.floor(unit.experience / 34);

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${unit.status === 'destroyed' ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{unit.icon}</span>
          <div>
            <div className="font-semibold text-sm">{unit.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{unit.unit_type} · {CATEGORY_ICONS[unit.category]} {unit.category}</div>
          </div>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded ${ERA_COLORS[unit.era] || 'bg-muted text-muted-foreground'}`}>{unit.era}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>HP</span><span>{unit.health}/100</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${healthColor}`} style={{ width: `${unit.health}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 text-xs text-center">
        <div className="bg-red-100 dark:bg-red-900/30 rounded p-1">
          <div className="font-bold text-red-700 dark:text-red-400">{unit.attack}</div>
          <div className="text-muted-foreground">ATK</div>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-1">
          <div className="font-bold text-blue-700 dark:text-blue-400">{unit.defense}</div>
          <div className="text-muted-foreground">DEF</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded p-1">
          <div className="font-bold text-green-700 dark:text-green-400">{unit.moves_remaining}/{unit.moves}</div>
          <div className="text-muted-foreground">MOV</div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-1">
          <div className="font-bold text-yellow-700 dark:text-yellow-400">{'⭐'.repeat(expStars + 1).slice(0, 3)}</div>
          <div className="text-muted-foreground">EXP</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        📍 Tile ({unit.tile_col}, {unit.tile_row})
      </div>

      {isOwn && unit.status !== 'destroyed' && (
        <button
          onClick={() => onDisband(unit.id, unit.name)}
          className="w-full text-xs text-destructive border border-destructive/30 rounded py-1 hover:bg-destructive/10 transition-colors"
        >
          Disband Unit
        </button>
      )}
    </div>
  );
}

function TrainUnitPanel({ stateId, gameState, onRefresh }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const config = gameState?.config || {};
  const unitTypes = config.unit_types || {};
  const researched = gameState?.researched_techs || {};
  const cities = gameState?.cities || [];
  const capitalCity = cities.find((c) => c.is_capital) || cities[0];

  const canTrain = (unitCfg) => {
    if (!unitCfg.requires_tech) return true;
    return researched[unitCfg.requires_tech]?.researched;
  };

  const hasBuilding = (unitCfg) => {
    if (!unitCfg.requires_building || !capitalCity) return true;
    const grid = capitalCity.city_grid || [];
    for (const row of grid) {
      for (const cell of row) {
        if (cell && cell.type === unitCfg.requires_building) return true;
      }
    }
    return false;
  };

  const handleTrain = async () => {
    if (!selectedType || !capitalCity) return;
    setLoading(true);
    try {
      const result = await gameApi.trainUnit(stateId, selectedType, capitalCity.id);
      toast({ title: `${result.unit.name} trained!`, description: `Gold remaining: ${result.gold}`, duration: 3000 });
      setSelectedType(null);
      onRefresh?.();
    } catch (err) {
      toast({ title: 'Training failed', description: err.message, variant: 'destructive', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const grouped = ERA_ORDER.reduce((acc, era) => {
    acc[era] = Object.entries(unitTypes).filter(([, cfg]) => cfg.era === era);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Train New Unit</h3>
        <div className="text-sm font-medium text-yellow-600">💰 {gameState?.gold?.toLocaleString()} gold</div>
      </div>

      {!capitalCity && (
        <div className="text-sm text-muted-foreground bg-muted rounded p-3">No city found to train units from.</div>
      )}

      {ERA_ORDER.map((era) => {
        const eraUnits = grouped[era] || [];
        if (eraUnits.length === 0) return null;
        return (
          <div key={era} className="space-y-2">
            <div className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded w-fit ${ERA_COLORS[era]}`}>{era} era</div>
            <div className="grid grid-cols-2 gap-2">
              {eraUnits.map(([typeId, cfg]) => {
                const trained = canTrain(cfg);
                const built = hasBuilding(cfg);
                const available = trained && built;
                const isSelected = selectedType === typeId;
                return (
                  <button
                    key={typeId}
                    disabled={!available}
                    onClick={() => setSelectedType(isSelected ? null : typeId)}
                    className={`rounded-lg border p-2 text-left transition-colors ${
                      isSelected ? 'border-primary bg-primary/10' : available ? 'hover:border-primary/50 hover:bg-muted' : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-lg">{cfg.icon}</span>
                      <span className="text-xs font-medium">{cfg.name}</span>
                    </div>
                    <div className="flex gap-1 text-xs text-muted-foreground">
                      <span>⚔️{cfg.attack}</span>
                      <span>🛡️{cfg.defense}</span>
                      <span className="ml-auto text-yellow-600 font-medium">💰{cfg.cost}</span>
                    </div>
                    {!trained && (
                      <div className="text-xs text-red-500 mt-1">🔬 Needs research</div>
                    )}
                    {trained && !built && (
                      <div className="text-xs text-orange-500 mt-1">🏗️ Needs building</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedType && (
        <div className="rounded-lg bg-primary/10 border border-primary p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{unitTypes[selectedType]?.icon}</span>
            <div>
              <div className="font-medium text-sm">{unitTypes[selectedType]?.name}</div>
              <div className="text-xs text-muted-foreground">Cost: 💰 {unitTypes[selectedType]?.cost}</div>
            </div>
          </div>
          <button
            onClick={handleTrain}
            disabled={loading}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Training…' : 'Train'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MilitaryCommand({ stateId, gameState, onRefresh }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('roster');

  const units = gameState?.military_units || [];
  const activeUnits = units.filter((u) => u.status !== 'destroyed');
  const destroyedUnits = units.filter((u) => u.status === 'destroyed');

  const totalAttack = activeUnits.reduce((s, u) => s + u.attack, 0);
  const totalDefense = activeUnits.reduce((s, u) => s + u.defense, 0);
  const avgHealth = activeUnits.length > 0 ? Math.round(activeUnits.reduce((s, u) => s + u.health, 0) / activeUnits.length) : 0;

  const handleDisband = async (unitId, name) => {
    if (!confirm(`Disband ${name}? This cannot be undone.`)) return;
    try {
      await gameApi.disbandUnit(stateId, unitId);
      toast({ title: `${name} disbanded`, duration: 2000 });
      onRefresh?.();
    } catch (err) {
      toast({ title: 'Failed to disband', description: err.message, variant: 'destructive', duration: 3000 });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-red-500">{totalAttack}</div>
          <div className="text-xs text-muted-foreground">Total Attack Power</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-blue-500">{totalDefense}</div>
          <div className="text-xs text-muted-foreground">Total Defense Power</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-green-500">{avgHealth}%</div>
          <div className="text-xs text-muted-foreground">Average Unit Health</div>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {[['roster', `🪖 Active (${activeUnits.length})`], ['train', '➕ Train Units'], ['destroyed', `💀 Lost (${destroyedUnits.length})`]].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-3 py-1.5 text-sm border-b-2 transition-colors -mb-px ${activeTab === id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'roster' && (
        <div>
          {activeUnits.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted rounded p-4 text-center">
              No active units. Train some units to defend your nation!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeUnits.map((unit) => (
                <UnitCard key={unit.id} unit={unit} onDisband={handleDisband} isOwn={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'train' && (
        <TrainUnitPanel stateId={stateId} gameState={gameState} onRefresh={onRefresh} />
      )}

      {activeTab === 'destroyed' && (
        <div>
          {destroyedUnits.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted rounded p-4 text-center">No units lost in battle.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {destroyedUnits.map((unit) => (
                <UnitCard key={unit.id} unit={unit} onDisband={() => {}} isOwn={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

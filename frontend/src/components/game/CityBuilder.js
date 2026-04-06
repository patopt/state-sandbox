'use client';

import { useState, useCallback } from 'react';
import { gameApi } from '@/lib/game-api';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 20;
const CELL_PX = 24;

const CATEGORY_GROUPS = {
  'Zones': ['residential_low', 'residential_mid', 'residential_high', 'commercial', 'industrial'],
  'Roads & Infrastructure': ['road', 'water_tower'],
  'Power': ['power_plant_coal', 'power_plant_solar', 'power_plant_nuclear'],
  'Services': ['police_station', 'fire_station', 'hospital', 'school', 'park'],
  'Economy': ['market', 'bank', 'factory'],
  'Military': ['barracks', 'airbase', 'harbor'],
  'Science': ['university', 'space_center'],
};

function CityGrid({ grid, buildingTypes, onCellClick, hoveredCell, onHover }) {
  return (
    <div
      className="rounded-lg border overflow-auto bg-[#0f172a]"
      style={{ maxHeight: 520 }}
    >
      <svg
        width={GRID_SIZE * CELL_PX}
        height={GRID_SIZE * CELL_PX}
        style={{ display: 'block' }}
      >
        <rect width={GRID_SIZE * CELL_PX} height={GRID_SIZE * CELL_PX} fill="#1e293b" />

        {Array.from({ length: GRID_SIZE }).map((_, r) =>
          Array.from({ length: GRID_SIZE }).map((_, c) => {
            const cell = grid[r]?.[c];
            const btype = cell?.type;
            const cfg = btype ? buildingTypes[btype] : null;
            const isHovered = hoveredCell?.r === r && hoveredCell?.c === c;
            const x = c * CELL_PX;
            const y = r * CELL_PX;

            return (
              <g
                key={`${r}-${c}`}
                onClick={() => onCellClick(r, c, !!cell)}
                onMouseEnter={() => onHover({ r, c, cell, cfg })}
                onMouseLeave={() => onHover(null)}
                style={{ cursor: cell ? 'context-menu' : 'crosshair' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={CELL_PX}
                  height={CELL_PX}
                  fill={cfg?.color || '#0f172a'}
                  stroke={isHovered ? '#f8fafc' : '#1e3a5f'}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  opacity={cfg ? 1 : 0.6}
                />
                {cfg && (
                  <text
                    x={x + CELL_PX / 2}
                    y={y + CELL_PX / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={12}
                  >
                    {cfg.icon}
                  </text>
                )}
                {!cfg && isHovered && (
                  <text
                    x={x + CELL_PX / 2}
                    y={y + CELL_PX / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8}
                    fill="#64748b"
                  >+</text>
                )}
              </g>
            );
          })
        )}

        <line x1={0} y1={GRID_SIZE * CELL_PX / 2} x2={GRID_SIZE * CELL_PX} y2={GRID_SIZE * CELL_PX / 2} stroke="#1e3a5f" strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
        <line x1={GRID_SIZE * CELL_PX / 2} y1={0} x2={GRID_SIZE * CELL_PX / 2} y2={GRID_SIZE * CELL_PX} stroke="#1e3a5f" strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
      </svg>
    </div>
  );
}

function CityStats({ stats, budget }) {
  const powerStatus = stats.power_ok ? '✅' : '⚠️';
  const waterStatus = stats.water_ok ? '✅' : '⚠️';
  const happinessColor = stats.happiness > 70 ? 'text-green-500' : stats.happiness > 40 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="rounded border bg-card p-2 space-y-1">
        <div className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Population</div>
        <div className="text-lg font-bold">{stats.population?.toLocaleString()}</div>
      </div>
      <div className="rounded border bg-card p-2 space-y-1">
        <div className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Happiness</div>
        <div className={`text-lg font-bold ${happinessColor}`}>{stats.happiness}%</div>
      </div>
      <div className="rounded border bg-card p-2 space-y-1">
        <div className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Income/Turn</div>
        <div className="text-lg font-bold text-green-500">💰 {stats.income?.toLocaleString()}</div>
      </div>
      <div className="rounded border bg-card p-2 space-y-1">
        <div className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Budget</div>
        <div className="text-lg font-bold">{budget?.toLocaleString()}</div>
      </div>
      <div className="rounded border bg-card p-2 space-y-1">
        <div className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Power</div>
        <div className="text-sm">{powerStatus} {stats.power_supply}/{stats.power_demand} MW</div>
      </div>
      <div className="rounded border bg-card p-2 space-y-1">
        <div className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Water</div>
        <div className="text-sm">{waterStatus} {stats.water_supply}/{stats.water_demand}</div>
      </div>
    </div>
  );
}

export default function CityBuilder({ stateId, gameState, onRefresh }) {
  const { toast } = useToast();
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [mode, setMode] = useState('build');
  const [loading, setLoading] = useState(false);

  const config = gameState?.config || {};
  const buildingTypes = config.building_types || {};
  const researched = gameState?.researched_techs || {};
  const cities = gameState?.cities || [];
  const gold = gameState?.gold || 0;

  const currentCity = selectedCity
    ? cities.find((c) => c.id === selectedCity)
    : cities.find((c) => c.is_capital) || cities[0];

  const canBuild = (btype) => {
    const cfg = buildingTypes[btype];
    if (!cfg) return false;
    if (cfg.requires_tech && !researched[cfg.requires_tech]?.researched) return false;
    return true;
  };

  const computeStats = () => {
    if (!currentCity) return { population: 0, happiness: 50, income: 0, power_supply: 0, power_demand: 0, power_ok: false, water_supply: 0, water_demand: 0, water_ok: false };
    const grid = currentCity.city_grid || [];
    let population = currentCity.population || 10000;
    let happiness = 50;
    let income = 0;
    let power_supply = 0;
    let power_demand = 0;
    let water_supply = 0;
    let water_demand = 0;

    for (const row of grid) {
      for (const cell of row) {
        if (!cell?.type || !buildingTypes[cell.type]) continue;
        const cfg = buildingTypes[cell.type];
        population += cfg.population_capacity || 0;
        happiness += cfg.happiness || 0;
        income += cfg.income || 0;
        power_supply += cfg.power_supply || 0;
        power_demand += cfg.power_demand || 0;
        water_supply += cfg.water_supply || 0;
        water_demand += cfg.water_demand || 0;
      }
    }
    return {
      population, happiness: Math.min(100, Math.max(0, happiness)), income,
      power_supply, power_demand, power_ok: power_supply >= power_demand,
      water_supply, water_demand, water_ok: water_supply >= water_demand,
    };
  };

  const handleCellClick = useCallback(async (r, c, occupied) => {
    if (!currentCity) return;
    if (mode === 'build' && selectedBuilding && !occupied) {
      const cfg = buildingTypes[selectedBuilding];
      if (!cfg) return;
      if (gold < cfg.cost) {
        toast({ title: 'Not enough gold', description: `Need ${cfg.cost} gold`, variant: 'destructive', duration: 3000 });
        return;
      }
      setLoading(true);
      try {
        await gameApi.buildInCity(stateId, currentCity.id, r, c, selectedBuilding);
        toast({ title: `${cfg.name} built!`, description: `Cost: 💰 ${cfg.cost}`, duration: 2000 });
        onRefresh?.();
      } catch (err) {
        toast({ title: 'Build failed', description: err.message, variant: 'destructive', duration: 3000 });
      } finally {
        setLoading(false);
      }
    } else if (mode === 'demolish' && occupied) {
      if (!confirm('Demolish this building?')) return;
      setLoading(true);
      try {
        await gameApi.demolishInCity(stateId, currentCity.id, r, c);
        toast({ title: 'Building demolished', duration: 2000 });
        onRefresh?.();
      } catch (err) {
        toast({ title: 'Demolish failed', description: err.message, variant: 'destructive', duration: 3000 });
      } finally {
        setLoading(false);
      }
    }
  }, [mode, selectedBuilding, currentCity, stateId, buildingTypes, gold, onRefresh, toast]);

  const stats = computeStats();

  if (!currentCity) {
    return <div className="text-sm text-muted-foreground p-4">No city found.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => setSelectedCity(city.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${currentCity?.id === city.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-primary/30'}`}
              >
                {city.is_capital ? '🏛️' : '🏙️'} {city.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setMode('build')}
              className={`px-2.5 py-1 rounded text-xs border transition-colors ${mode === 'build' ? 'bg-green-600 text-white border-green-600' : 'bg-muted border-transparent hover:border-green-400'}`}
            >🏗️ Build</button>
            <button
              onClick={() => { setMode('demolish'); setSelectedBuilding(null); }}
              className={`px-2.5 py-1 rounded text-xs border transition-colors ${mode === 'demolish' ? 'bg-red-600 text-white border-red-600' : 'bg-muted border-transparent hover:border-red-400'}`}
            >🔨 Demolish</button>
          </div>
        </div>

        {mode === 'build' && (
          <div className="text-xs text-muted-foreground">
            {selectedBuilding ? `Selected: ${buildingTypes[selectedBuilding]?.icon} ${buildingTypes[selectedBuilding]?.name} (💰 ${buildingTypes[selectedBuilding]?.cost}) — click empty cell to build` : 'Select a building from the panel, then click an empty cell to build'}
          </div>
        )}
        {mode === 'demolish' && (
          <div className="text-xs text-red-500">Click a building on the grid to demolish it (you'll get 25% refund)</div>
        )}

        <CityGrid
          grid={currentCity.city_grid || []}
          buildingTypes={buildingTypes}
          onCellClick={handleCellClick}
          hoveredCell={hoveredCell}
          onHover={setHoveredCell}
        />

        {hoveredCell?.cfg && (
          <div className="rounded border bg-card p-2 flex items-center gap-3 text-xs">
            <span className="text-lg">{hoveredCell.cfg.icon}</span>
            <div>
              <span className="font-semibold">{hoveredCell.cfg.name}</span>
              <span className="text-muted-foreground ml-2">
                {hoveredCell.cfg.income !== 0 && <span className="mr-1">💰 {hoveredCell.cfg.income > 0 ? '+' : ''}{hoveredCell.cfg.income}/turn</span>}
                {hoveredCell.cfg.happiness !== 0 && <span className="mr-1">{hoveredCell.cfg.happiness > 0 ? '😊' : '😞'} {hoveredCell.cfg.happiness > 0 ? '+' : ''}{hoveredCell.cfg.happiness}</span>}
                {hoveredCell.cfg.power_supply > 0 && <span className="mr-1">⚡ +{hoveredCell.cfg.power_supply}</span>}
                {hoveredCell.cfg.power_demand > 0 && <span className="mr-1">⚡ -{hoveredCell.cfg.power_demand}</span>}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <CityStats stats={stats} budget={currentCity.budget} />

        <div className="space-y-3">
          <div className="text-sm font-semibold flex items-center justify-between">
            <span>Buildings</span>
            <span className="text-xs text-yellow-600">💰 {gold.toLocaleString()}</span>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {Object.entries(CATEGORY_GROUPS).map(([groupName, btypes]) => {
              const available = btypes.filter((id) => buildingTypes[id] && canBuild(id));
              if (available.length === 0) return null;
              return (
                <div key={groupName} className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{groupName}</div>
                  {available.map((btype) => {
                    const cfg = buildingTypes[btype];
                    const isSelected = selectedBuilding === btype;
                    const canAfford = gold >= cfg.cost;
                    return (
                      <button
                        key={btype}
                        disabled={!canAfford && mode === 'build'}
                        onClick={() => {
                          if (mode === 'build') setSelectedBuilding(isSelected ? null : btype);
                        }}
                        className={`w-full rounded border p-2 text-left text-xs transition-colors ${
                          isSelected && mode === 'build'
                            ? 'border-primary bg-primary/10'
                            : !canAfford
                            ? 'opacity-40'
                            : 'hover:border-primary/40 hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>{cfg.icon}</span>
                            <span className="font-medium">{cfg.name}</span>
                          </span>
                          <span className={`font-medium ${canAfford ? 'text-yellow-600' : 'text-red-500'}`}>💰{cfg.cost}</span>
                        </div>
                        <div className="text-muted-foreground mt-0.5 flex gap-2">
                          {cfg.income !== 0 && <span>{cfg.income > 0 ? '+' : ''}{cfg.income}/turn</span>}
                          {cfg.happiness !== 0 && <span>😊 {cfg.happiness > 0 ? '+' : ''}{cfg.happiness}</span>}
                          {cfg.power_supply > 0 && <span>⚡+{cfg.power_supply}</span>}
                          {cfg.enables_units?.length > 0 && <span>🪖 enables units</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

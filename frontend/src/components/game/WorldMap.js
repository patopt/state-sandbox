'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gameApi } from '@/lib/game-api';
import { useToast } from '@/hooks/use-toast';

const HEX_SIZE = 20;
const SQRT3 = Math.sqrt(3);

const TERRAIN_COLORS = {
  ocean: '#1e40af',
  coast: '#3b82f6',
  plains: '#86efac',
  grassland: '#4ade80',
  desert: '#fbbf24',
  forest: '#166534',
  jungle: '#14532d',
  mountain: '#78716c',
  hills: '#a8a29e',
  tundra: '#e2e8f0',
  snow: '#f8fafc',
};

const STATUS_COLORS = {
  neutral: '#94a3b8',
  friendly: '#4ade80',
  cold: '#fbbf24',
  hostile: '#ef4444',
  allied: '#818cf8',
};

function hexCenter(col, row) {
  const x = HEX_SIZE * SQRT3 * (col + 0.5 * (row & 1));
  const y = HEX_SIZE * 1.5 * row;
  return { x, y };
}

function hexPoints(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + HEX_SIZE * Math.cos(angle)).toFixed(1)},${(cy + HEX_SIZE * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function hexContains(col, row, px, py) {
  const { x, y } = hexCenter(col, row);
  const dx = px - x;
  const dy = py - y;
  return Math.sqrt(dx * dx + dy * dy) < HEX_SIZE * 0.9;
}

function getOwnerColor(owner, stateId, aiCountries) {
  if (!owner) return null;
  if (owner === String(stateId)) return '#f97316';
  const ai = aiCountries.find((c) => c.id === owner);
  return ai ? ai.flag_color : '#6b7280';
}

export default function WorldMap({ stateId, gameState, onRefresh }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 520 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [mode, setMode] = useState('select');
  const { toast } = useToast();

  const mapData = gameState?.map_data || {};
  const tiles = mapData.tiles || [];
  const aiCountries = mapData.ai_countries || [];
  const units = gameState?.military_units || [];
  const cities = gameState?.cities || [];
  const playerCapital = mapData.player_capital || {};

  useEffect(() => {
    if (playerCapital.col !== undefined) {
      const { x, y } = hexCenter(playerCapital.col, playerCapital.row);
      setViewBox({ x: x - 400, y: y - 260, w: 800, h: 520 });
    }
  }, [playerCapital.col, playerCapital.row]);

  const handleSvgMouseDown = useCallback((e) => {
    if (e.button === 1 || e.altKey) {
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, vb: { ...viewBox } });
      e.preventDefault();
    }
  }, [viewBox]);

  const handleSvgMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return;
    const dx = (e.clientX - dragStart.x) * (dragStart.vb.w / (containerRef.current?.clientWidth || 800));
    const dy = (e.clientY - dragStart.y) * (dragStart.vb.h / (containerRef.current?.clientHeight || 520));
    setViewBox({ ...dragStart.vb, x: dragStart.vb.x - dx, y: dragStart.vb.y - dy });
  }, [dragging, dragStart]);

  const handleSvgMouseUp = useCallback(() => setDragging(false), []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    setViewBox((prev) => {
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      const nw = Math.min(2000, Math.max(300, prev.w * factor));
      const nh = Math.min(1300, Math.max(200, prev.h * factor));
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
    });
  }, []);

  const svgCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = viewBox.x + ((e.clientX - rect.left) / rect.width) * viewBox.w;
    const sy = viewBox.y + ((e.clientY - rect.top) / rect.height) * viewBox.h;
    return { x: sx, y: sy };
  }, [viewBox]);

  const findTileAt = useCallback((svgX, svgY) => {
    const rows = tiles.length;
    const cols = rows > 0 ? tiles[0].length : 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (hexContains(c, r, svgX, svgY)) return { col: c, row: r, tile: tiles[r][c] };
      }
    }
    return null;
  }, [tiles]);

  const handleTileClick = useCallback(async (e) => {
    if (dragging) return;
    const { x, y } = svgCoords(e);
    const found = findTileAt(x, y);
    if (!found) return;

    const { col, row, tile } = found;

    if (mode === 'move' && selectedUnit) {
      try {
        await gameApi.moveUnit(stateId, selectedUnit.id, col, row);
        toast({ title: `${selectedUnit.name} moved`, duration: 2000 });
        setSelectedUnit(null);
        setMode('select');
        onRefresh?.();
      } catch (err) {
        toast({ title: 'Move failed', description: err.message, variant: 'destructive', duration: 3000 });
      }
      return;
    }

    if (mode === 'attack' && selectedUnit) {
      try {
        const result = await gameApi.attackUnit(stateId, selectedUnit.id, col, row);
        toast({ title: 'Attack!', description: result.message, duration: 3000 });
        setSelectedUnit(null);
        setMode('select');
        onRefresh?.();
      } catch (err) {
        toast({ title: 'Attack failed', description: err.message, variant: 'destructive', duration: 3000 });
      }
      return;
    }

    const clickedUnit = units.find((u) => u.tile_col === col && u.tile_row === row);
    if (clickedUnit) {
      setSelectedUnit(clickedUnit);
      setMode('select');
    } else {
      setSelectedUnit(null);
    }
  }, [dragging, mode, selectedUnit, stateId, units, findTileAt, svgCoords, onRefresh, toast]);

  const handleMouseMoveOnSvg = useCallback((e) => {
    handleSvgMouseMove(e);
    if (!dragging) {
      const { x, y } = svgCoords(e);
      const found = findTileAt(x, y);
      setHoveredTile(found || null);
    }
  }, [handleSvgMouseMove, dragging, svgCoords, findTileAt]);

  const rows = tiles.length;
  const cols = rows > 0 ? tiles[0].length : 0;
  const mapW = HEX_SIZE * SQRT3 * (cols + 0.5);
  const mapH = HEX_SIZE * 1.5 * rows + HEX_SIZE * 0.5;

  const diplomacy = gameState?.diplomacy || [];
  const statusByAiId = Object.fromEntries(diplomacy.map((d) => [d.ai_country_id, d.status]));

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Alt+Drag to pan · Scroll to zoom</span>
        <div className="flex gap-1 ml-auto">
          <button
            className={`px-2 py-1 rounded text-xs font-medium border ${mode === 'select' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => setMode('select')}
          >Select</button>
          {selectedUnit && (
            <>
              <button
                className={`px-2 py-1 rounded text-xs font-medium border ${mode === 'move' ? 'bg-blue-600 text-white' : 'bg-muted'}`}
                onClick={() => setMode('move')}
              >Move {selectedUnit.icon}</button>
              <button
                className={`px-2 py-1 rounded text-xs font-medium border ${mode === 'attack' ? 'bg-red-600 text-white' : 'bg-muted'}`}
                onClick={() => setMode('attack')}
              >Attack ⚔️</button>
            </>
          )}
          <button
            className="px-2 py-1 rounded text-xs border bg-muted"
            onClick={() => {
              if (playerCapital.col !== undefined) {
                const { x, y } = hexCenter(playerCapital.col, playerCapital.row);
                setViewBox({ x: x - 400, y: y - 260, w: 800, h: 520 });
              }
            }}
          >🏠 Home</button>
        </div>
      </div>

      <div ref={containerRef} className="relative rounded-lg border overflow-hidden bg-[#0f172a]" style={{ height: 480 }}>
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: dragging ? 'grabbing' : mode === 'move' ? 'crosshair' : mode === 'attack' ? 'cell' : 'default' }}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleMouseMoveOnSvg}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
          onWheel={handleWheel}
          onClick={handleTileClick}
        >
          {tiles.map((rowArr, r) =>
            rowArr.map((tile, c) => {
              const { x, y } = hexCenter(c, r);
              const terrain = tile.terrain || 'plains';
              const baseColor = TERRAIN_COLORS[terrain] || '#86efac';
              const ownerColor = getOwnerColor(tile.owner, stateId, aiCountries);
              const isHovered = hoveredTile?.col === c && hoveredTile?.row === r;
              const pts = hexPoints(x, y);

              return (
                <g key={`${c}-${r}`}>
                  <polygon
                    points={pts}
                    fill={baseColor}
                    stroke={ownerColor || (showGrid ? '#1e293b' : baseColor)}
                    strokeWidth={ownerColor ? 2.5 : 0.5}
                    opacity={isHovered ? 0.85 : 1}
                  />
                  {ownerColor && (
                    <polygon points={pts} fill={ownerColor} opacity={0.18} />
                  )}
                  {tile.city && (
                    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={terrain === 'ocean' ? 6 : 10}>
                      {tile.city.is_capital ? '🏛️' : '🏙️'}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {units.map((unit) => {
            const { x, y } = hexCenter(unit.tile_col, unit.tile_row);
            const isSelected = selectedUnit?.id === unit.id;
            return (
              <g key={`unit-${unit.id}`}>
                {isSelected && (
                  <circle cx={x} cy={y} r={HEX_SIZE * 0.7} fill="none" stroke="#f97316" strokeWidth={2.5} strokeDasharray="4 2">
                    <animate attributeName="stroke-dashoffset" from="0" to="12" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r={HEX_SIZE * 0.45} fill={isSelected ? '#f97316' : '#1e293b'} stroke="#f8fafc" strokeWidth={1} />
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={9}>{unit.icon}</text>
                {unit.health < 100 && (
                  <>
                    <rect x={x - 8} y={y + HEX_SIZE * 0.5} width={16} height={2.5} fill="#ef4444" rx={1} />
                    <rect x={x - 8} y={y + HEX_SIZE * 0.5} width={16 * unit.health / 100} height={2.5} fill="#4ade80" rx={1} />
                  </>
                )}
              </g>
            );
          })}

          {mode === 'move' && selectedUnit && hoveredTile && (
            <polygon
              points={hexPoints(hexCenter(hoveredTile.col, hoveredTile.row).x, hexCenter(hoveredTile.col, hoveredTile.row).y)}
              fill="#3b82f6"
              opacity={0.35}
            />
          )}
          {mode === 'attack' && selectedUnit && hoveredTile && (
            <polygon
              points={hexPoints(hexCenter(hoveredTile.col, hoveredTile.row).x, hexCenter(hoveredTile.col, hoveredTile.row).y)}
              fill="#ef4444"
              opacity={0.35}
            />
          )}
        </svg>

        {hoveredTile && (
          <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
            <span className="capitalize font-medium">{hoveredTile.tile?.terrain}</span>
            {hoveredTile.tile?.city && <span className="ml-2">🏙️ {hoveredTile.tile.city.name}</span>}
            {hoveredTile.tile?.owner && <span className="ml-2 opacity-70">
              {hoveredTile.tile.owner === String(stateId) ? '🟠 Your territory' : '🔵 Foreign territory'}
            </span>}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap text-xs">
        {Object.entries(TERRAIN_COLORS).slice(0, 7).map(([t, c]) => (
          <span key={t} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: c }} />
            <span className="capitalize text-muted-foreground">{t}</span>
          </span>
        ))}
        <span className="flex items-center gap-1 ml-2">
          <span className="inline-block w-3 h-3 rounded-sm border-2 border-orange-500" />
          <span className="text-muted-foreground">Your territory</span>
        </span>
      </div>

      {selectedUnit && (
        <div className="rounded-lg border bg-card p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedUnit.icon}</span>
            <div>
              <div className="font-semibold text-sm">{selectedUnit.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{selectedUnit.unit_type} · HP {selectedUnit.health}/100 · Moves: {selectedUnit.moves_remaining}/{selectedUnit.moves}</div>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">⚔️ {selectedUnit.attack}</span>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">🛡️ {selectedUnit.defense}</span>
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">⭐ {selectedUnit.experience}</span>
          </div>
          <button
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={() => setSelectedUnit(null)}
          >✕</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {aiCountries.map((ai) => {
          const rel = diplomacy.find((d) => d.ai_country_id === ai.id);
          const status = rel?.status || 'neutral';
          return (
            <div key={ai.id} className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs bg-card">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: ai.flag_color }} />
              <span className="font-medium">{ai.name}</span>
              <span className="capitalize" style={{ color: STATUS_COLORS[status] || '#94a3b8' }}>·{status}</span>
              {rel && <span className="text-muted-foreground">({rel.relation_score})</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

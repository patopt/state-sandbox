'use client';

import { useState, useCallback, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from 'react-simple-maps';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Sample AI-controlled nations for diplomacy (generated randomly per game)
const SAMPLE_NATIONS = [
  { id: 1, name: 'Valorian Federation', coords: [15, 52], color: '#3b82f6', relation: 'neutral', power: 'medium' },
  { id: 2, name: 'Solarian Empire', coords: [45, 38], color: '#ef4444', relation: 'rival', power: 'high' },
  { id: 3, name: 'Meridian Republic', coords: [-70, 0], color: '#22c55e', relation: 'ally', power: 'medium' },
  { id: 4, name: 'Khorazar Khanate', coords: [65, 42], color: '#f59e0b', relation: 'neutral', power: 'low' },
  { id: 5, name: 'Thalassian Commonwealth', coords: [120, -25], color: '#8b5cf6', relation: 'friendly', power: 'medium' },
];

const RELATION_COLORS = {
  ally: '#22c55e',
  friendly: '#86efac',
  neutral: '#94a3b8',
  rival: '#f97316',
  enemy: '#ef4444',
  war: '#dc2626',
};

function WorldMap({ playerNation, nations = SAMPLE_NATIONS, selectedNation, onSelectNation, militaryUnits = [] }) {
  const [hoveredGeo, setHoveredGeo] = useState(null);
  const [tooltipContent, setTooltipContent] = useState('');
  const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1.4 });

  const handleMoveEnd = useCallback((position) => {
    setPosition(position);
  }, []);

  return (
    <div className="relative w-full h-full world-map-container rounded-xl overflow-hidden border border-white/10">
      {/* Map overlay gradient */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/60 to-transparent" />
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-20 glass-panel rounded-lg p-2.5 text-xs space-y-1.5">
        <div className="text-muted-foreground font-medium mb-1">Relations</div>
        {Object.entries(RELATION_COLORS).map(([rel, color]) => (
          <div key={rel} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize text-foreground/70">{rel}</span>
          </div>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1">
        <button
          className="w-7 h-7 glass-panel rounded flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors text-lg leading-none"
          onClick={() => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))}
        >
          +
        </button>
        <button
          className="w-7 h-7 glass-panel rounded flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors text-lg leading-none"
          onClick={() => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))}
        >
          −
        </button>
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 glass-panel rounded-lg px-3 py-1.5 text-xs text-foreground pointer-events-none">
          {tooltipContent}
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 130 }}
        className="w-full h-full"
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => {
                    setHoveredGeo(geo.rsmKey);
                    setTooltipContent(geo.properties.name || '');
                  }}
                  onMouseLeave={() => {
                    setHoveredGeo(null);
                    setTooltipContent('');
                  }}
                  style={{
                    default: {
                      fill: hoveredGeo === geo.rsmKey ? 'hsl(188 100% 42% / 0.3)' : 'hsl(220 20% 15%)',
                      stroke: 'hsl(220 20% 22%)',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                    hover: {
                      fill: 'hsl(188 100% 42% / 0.3)',
                      stroke: 'hsl(188 100% 42% / 0.6)',
                      strokeWidth: 0.8,
                      outline: 'none',
                      cursor: 'pointer',
                    },
                    pressed: {
                      fill: 'hsl(270 70% 60% / 0.3)',
                      outline: 'none',
                    },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Nation markers */}
          {nations.map((nation) => {
            const isSelected = selectedNation?.id === nation.id;
            const color = RELATION_COLORS[nation.relation] || RELATION_COLORS.neutral;
            return (
              <Marker
                key={nation.id}
                coordinates={nation.coords}
                onClick={() => onSelectNation?.(nation)}
              >
                <g className="cursor-pointer" transform="translate(-10, -10)">
                  {/* Pulse ring */}
                  {isSelected && (
                    <circle
                      cx="10" cy="10" r="14"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      opacity="0.4"
                      className="animate-pulse"
                    />
                  )}
                  {/* Main circle */}
                  <circle
                    cx="10" cy="10" r="7"
                    fill={color}
                    fillOpacity={isSelected ? 0.9 : 0.7}
                    stroke={isSelected ? '#fff' : color}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />
                  {/* Star for capital */}
                  <text x="10" y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
                    ★
                  </text>
                </g>
                {/* Nation name label */}
                <text
                  y={-18}
                  textAnchor="middle"
                  className="fill-white text-[7px]"
                  style={{ fontSize: '7px', fill: 'rgba(255,255,255,0.8)', fontFamily: 'sans-serif' }}
                >
                  {nation.name.split(' ')[0]}
                </text>
              </Marker>
            );
          })}

          {/* Military unit markers */}
          {militaryUnits.map((unit) => (
            <Marker key={unit.id} coordinates={unit.coords}>
              <g transform="translate(-6, -6)">
                <rect
                  width="12" height="12"
                  rx="2"
                  fill={unit.type === 'army' ? '#ef4444' : unit.type === 'navy' ? '#3b82f6' : '#8b5cf6'}
                  fillOpacity="0.85"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="0.8"
                />
                <text x="6" y="9.5" textAnchor="middle" fontSize="7" fill="white">
                  {unit.type === 'army' ? '⚔' : unit.type === 'navy' ? '⚓' : '✈'}
                </text>
              </g>
            </Marker>
          ))}

          {/* Player nation marker */}
          {playerNation?.capital && (
            <Marker coordinates={playerNation.capital.coords || [0, 0]}>
              <g transform="translate(-12, -12)">
                <circle cx="12" cy="12" r="10" fill="hsl(188 100% 42%)" fillOpacity="0.2" />
                <circle cx="12" cy="12" r="7" fill="hsl(188 100% 42%)" />
                <text x="12" y="16" textAnchor="middle" fontSize="9" fill="hsl(230 25% 5%)" fontWeight="bold">P</text>
              </g>
              <text
                y={-20}
                textAnchor="middle"
                style={{ fontSize: '8px', fill: 'hsl(188 100% 42%)', fontFamily: 'sans-serif', fontWeight: 'bold' }}
              >
                {playerNation.name}
              </text>
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

export default memo(WorldMap);

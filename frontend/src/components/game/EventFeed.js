'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Zap, Globe, Shield, TrendingUp, Users, Cpu, Leaf } from 'lucide-react';

const CATEGORY_ICONS = {
  'Environmental': Leaf,
  'Economic': TrendingUp,
  'Defense': Shield,
  'Health': Users,
  'Cultural': Users,
  'Infrastructure': Cpu,
  'International': Globe,
  'Government': Zap,
};

const CATEGORY_COLORS = {
  'Environmental': 'text-green-400 border-green-500/30 bg-green-500/10',
  'Economic': 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  'Defense': 'text-red-400 border-red-500/30 bg-red-500/10',
  'Health': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  'Cultural': 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  'Infrastructure': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  'International': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  'Government': 'text-pink-400 border-pink-500/30 bg-pink-500/10',
};

function EventEntry({ event, isHighlighted }) {
  const [category, ...rest] = event.split(':');
  const text = rest.join(':').trim();
  const catKey = Object.keys(CATEGORY_ICONS).find((k) => category?.includes(k)) || 'Government';
  const Icon = CATEGORY_ICONS[catKey] || Zap;
  const colorClass = CATEGORY_COLORS[catKey] || 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';

  return (
    <div
      className={cn(
        'event-entry rounded-lg p-3 border text-sm transition-all',
        colorClass,
        isHighlighted && 'ring-1 ring-primary/40'
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {text ? (
            <>
              <span className="font-medium text-xs uppercase tracking-wider opacity-70">
                {category}
              </span>
              <p className="mt-0.5 leading-relaxed">{text}</p>
            </>
          ) : (
            <p className="leading-relaxed">{event}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventFeed({ events = [], policySuggestions = [], currentDate }) {
  const [showPolicy, setShowPolicy] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const validEvents = events.filter(
    (e) => e && e.trim() && !e.toLowerCase().includes('no notable events')
  );
  const displayedEvents = showAll ? validEvents : validEvents.slice(0, 5);

  const validPolicies = policySuggestions.filter((p) => p && p.trim().startsWith('-'));

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Upcoming Events */}
      <div className="glass-panel rounded-xl p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Upcoming Events
          </h3>
          {currentDate && (
            <span className="text-xs text-muted-foreground">{currentDate}</span>
          )}
        </div>

        {validEvents.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            No events forecasted
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {displayedEvents.map((event, i) => (
              <EventEntry key={i} event={event} isHighlighted={i === 0} />
            ))}

            {validEvents.length > 5 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1 transition-colors"
              >
                {showAll ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> +{validEvents.length - 5} more events</>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Policy Suggestions */}
      {validPolicies.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <button
            onClick={() => setShowPolicy((v) => !v)}
            className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-primary">⚡</span>
              AI Policy Suggestions
            </div>
            {showPolicy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showPolicy && (
            <ul className="space-y-1.5">
              {validPolicies.map((policy, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
                >
                  <span className="text-primary mt-0.5 flex-shrink-0">›</span>
                  <span>{policy.replace(/^-\s*/, '')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

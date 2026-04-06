'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Cpu, Zap, FlaskConical, Satellite, Brain, Globe, Shield, Leaf } from 'lucide-react';

const TECH_TREE = {
  'Digital & AI': {
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    icon: Brain,
    tiers: [
      { id: 'basic-internet', name: 'Internet Infrastructure', level: 1, desc: 'Basic broadband and mobile networks' },
      { id: 'cloud', name: 'Cloud Computing', level: 2, desc: 'Distributed computing infrastructure', requires: ['basic-internet'] },
      { id: 'ai-basic', name: 'Machine Learning', level: 2, desc: 'Applied ML in government and industry', requires: ['basic-internet'] },
      { id: 'cyber-defense', name: 'Cyber Defense', level: 3, desc: 'National cybersecurity infrastructure', requires: ['cloud', 'ai-basic'] },
      { id: 'ai-advanced', name: 'Advanced AI', level: 3, desc: 'General AI systems and automation', requires: ['ai-basic', 'cloud'] },
      { id: 'quantum-computing', name: 'Quantum Computing', level: 4, desc: 'Quantum supremacy in computation', requires: ['ai-advanced', 'cyber-defense'] },
    ],
  },
  'Energy': {
    color: 'from-yellow-500 to-orange-600',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    icon: Zap,
    tiers: [
      { id: 'fossil', name: 'Fossil Fuels', level: 1, desc: 'Coal, oil, and natural gas extraction' },
      { id: 'solar', name: 'Solar Energy', level: 2, desc: 'Photovoltaic and concentrated solar', requires: ['fossil'] },
      { id: 'wind', name: 'Wind Power', level: 2, desc: 'Onshore and offshore wind farms', requires: ['fossil'] },
      { id: 'nuclear-fission', name: 'Nuclear Fission', level: 3, desc: 'Pressurized water and boiling water reactors', requires: ['solar', 'wind'] },
      { id: 'smart-grid', name: 'Smart Grid', level: 3, desc: 'Intelligent power distribution network', requires: ['solar', 'wind'] },
      { id: 'fusion', name: 'Nuclear Fusion', level: 4, desc: 'Tokamak and inertial confinement fusion', requires: ['nuclear-fission', 'smart-grid'] },
    ],
  },
  'Military': {
    color: 'from-red-500 to-rose-700',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    icon: Shield,
    tiers: [
      { id: 'conventional', name: 'Conventional Forces', level: 1, desc: 'Traditional military units and weapons' },
      { id: 'precision', name: 'Precision Weapons', level: 2, desc: 'GPS-guided munitions and smart bombs', requires: ['conventional'] },
      { id: 'drones', name: 'Drone Warfare', level: 2, desc: 'Unmanned aerial and naval systems', requires: ['conventional'] },
      { id: 'hypersonic', name: 'Hypersonic Missiles', level: 3, desc: 'Mach 5+ weapons and glide vehicles', requires: ['precision', 'drones'] },
      { id: 'ai-warfare', name: 'AI Military Systems', level: 3, desc: 'Autonomous weapons and decision systems', requires: ['drones'] },
      { id: 'space-weapons', name: 'Space Weapons', level: 4, desc: 'Orbital strike and anti-satellite capabilities', requires: ['hypersonic', 'ai-warfare'] },
    ],
  },
  'Biotechnology': {
    color: 'from-green-500 to-emerald-700',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    icon: FlaskConical,
    tiers: [
      { id: 'pharma', name: 'Pharmaceuticals', level: 1, desc: 'Drug manufacturing and distribution' },
      { id: 'genomics', name: 'Genomics', level: 2, desc: 'DNA sequencing and genetic analysis', requires: ['pharma'] },
      { id: 'crispr', name: 'Gene Editing', level: 3, desc: 'CRISPR-Cas9 and precision gene therapy', requires: ['genomics'] },
      { id: 'synthetic-bio', name: 'Synthetic Biology', level: 4, desc: 'Engineering novel organisms and systems', requires: ['crispr'] },
    ],
  },
  'Space': {
    color: 'from-purple-500 to-indigo-700',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    icon: Satellite,
    tiers: [
      { id: 'satellites', name: 'Satellite Network', level: 1, desc: 'Communications and navigation satellites' },
      { id: 'launch', name: 'Space Launch', level: 2, desc: 'Orbital launch capability', requires: ['satellites'] },
      { id: 'moon', name: 'Lunar Program', level: 3, desc: 'Crewed lunar missions and bases', requires: ['launch'] },
      { id: 'mars', name: 'Mars Program', level: 4, desc: 'Interplanetary exploration', requires: ['moon'] },
    ],
  },
};

function TechNode({ tech, color, borderColor, textColor, isUnlocked, isResearching, onClick }) {
  return (
    <button
      onClick={() => onClick(tech)}
      className={cn(
        'relative px-3 py-2 rounded-lg border text-left transition-all text-xs w-40',
        isUnlocked
          ? `bg-gradient-to-br ${color} bg-opacity-20 ${borderColor} border-opacity-60 shadow-sm`
          : isResearching
          ? 'border-yellow-500/40 bg-yellow-500/10 animate-pulse'
          : 'border-white/10 bg-secondary/50 hover:bg-secondary hover:border-white/20',
      )}
    >
      <div className={cn('font-medium mb-0.5', isUnlocked ? 'text-white' : 'text-foreground')}>
        {tech.name}
      </div>
      <div className={cn('text-[10px] leading-tight', isUnlocked ? 'text-white/70' : 'text-muted-foreground')}>
        {tech.desc}
      </div>
      {isUnlocked && (
        <div className="absolute top-1 right-1 text-[8px] text-white/60 font-mono">✓</div>
      )}
      {isResearching && (
        <div className="absolute top-1 right-1 text-yellow-400 text-[8px]">⚡</div>
      )}
    </button>
  );
}

export default function TechTree({ techData, onResearch }) {
  const [activeCategory, setActiveCategory] = useState('Digital & AI');
  const [unlockedTechs, setUnlockedTechs] = useState(new Set(['basic-internet', 'fossil', 'conventional', 'pharma', 'satellites']));
  const [researchingTech, setResearchingTech] = useState(null);
  const [selectedTech, setSelectedTech] = useState(null);

  const category = TECH_TREE[activeCategory];

  const handleTechClick = (tech) => {
    setSelectedTech(tech);
  };

  const handleResearch = () => {
    if (!selectedTech) return;
    const prereqsMet = (selectedTech.requires || []).every((r) => unlockedTechs.has(r));
    if (!prereqsMet) return;
    setResearchingTech(selectedTech.id);
    onResearch?.(selectedTech);
    // Simulate research completing
    setTimeout(() => {
      setUnlockedTechs((prev) => new Set([...prev, selectedTech.id]));
      setResearchingTech(null);
      setSelectedTech(null);
    }, 2000);
  };

  // Group techs by level
  const byLevel = {};
  for (const tech of category.tiers) {
    if (!byLevel[tech.level]) byLevel[tech.level] = [];
    byLevel[tech.level].push(tech);
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Category tabs */}
      <div className="glass-panel rounded-xl p-2 flex gap-1.5 overflow-x-auto">
        {Object.entries(TECH_TREE).map(([name, cat]) => {
          const Icon = cat.icon;
          const unlockedCount = cat.tiers.filter((t) => unlockedTechs.has(t.id)).length;
          return (
            <button
              key={name}
              onClick={() => setActiveCategory(name)}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all',
                activeCategory === name
                  ? `bg-gradient-to-r ${cat.color} bg-opacity-20 ${cat.borderColor} text-white`
                  : 'border-white/10 hover:bg-secondary/50 text-muted-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{name}</span>
              <span className="opacity-60">{unlockedCount}/{cat.tiers.length}</span>
            </button>
          );
        })}
      </div>

      {/* Tech tree visualization */}
      <div className="glass-panel rounded-xl p-4 flex-1 overflow-auto">
        <div className="flex gap-6 min-w-max">
          {Object.entries(byLevel).map(([level, techs]) => (
            <div key={level} className="flex flex-col gap-3">
              <div className={cn('text-[10px] font-semibold uppercase tracking-wider text-center', category.textColor)}>
                Tier {level}
              </div>
              {techs.map((tech) => {
                const prereqsMet = (tech.requires || []).every((r) => unlockedTechs.has(r));
                return (
                  <TechNode
                    key={tech.id}
                    tech={tech}
                    color={category.color}
                    borderColor={category.borderColor}
                    textColor={category.textColor}
                    isUnlocked={unlockedTechs.has(tech.id)}
                    isResearching={researchingTech === tech.id}
                    onClick={handleTechClick}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected tech detail */}
      {selectedTech && (
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={cn('font-semibold text-sm', category.textColor)}>{selectedTech.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{selectedTech.desc}</div>
              {selectedTech.requires && selectedTech.requires.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground">Requires: </span>
                  {selectedTech.requires.map((r) => {
                    const isUnlocked = unlockedTechs.has(r);
                    const reqTech = category.tiers.find((t) => t.id === r);
                    return (
                      <span
                        key={r}
                        className={cn('mr-1', isUnlocked ? 'text-green-400' : 'text-red-400')}
                      >
                        {reqTech?.name || r}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            {!unlockedTechs.has(selectedTech.id) && (
              <button
                onClick={handleResearch}
                disabled={!(selectedTech.requires || []).every((r) => unlockedTechs.has(r)) || researchingTech !== null}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                {researchingTech ? 'Researching...' : 'Research'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Globe, Shield, TrendingUp, HandshakeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const RELATION_COLORS = {
  ally: 'text-green-400',
  friendly: 'text-emerald-400',
  neutral: 'text-slate-400',
  rival: 'text-orange-400',
  enemy: 'text-red-400',
  war: 'text-red-600',
};

const RELATION_BADGES = {
  ally: 'bg-green-500/20 text-green-400 border-green-500/30',
  friendly: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  neutral: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  rival: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  enemy: 'bg-red-500/20 text-red-400 border-red-500/30',
  war: 'bg-red-700/20 text-red-500 border-red-700/30',
};

const DIPLOMATIC_ACTIONS = [
  { id: 'trade', label: 'Propose Trade Deal', icon: TrendingUp, tone: 'diplomatic' },
  { id: 'alliance', label: 'Propose Alliance', icon: HandshakeIcon, tone: 'diplomatic' },
  { id: 'demand', label: 'Issue Demand', icon: Shield, tone: 'assertive' },
  { id: 'sanction', label: 'Impose Sanctions', icon: Globe, tone: 'hostile' },
];

function ChatMessage({ message }) {
  const isPlayer = message.sender === 'player';
  return (
    <div className={cn('flex gap-2.5 max-w-[85%]', isPlayer ? 'ml-auto flex-row-reverse' : '')}>
      {!isPlayer && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs bg-secondary border border-white/10">
          🏛
        </div>
      )}
      <div
        className={cn(
          'rounded-xl px-3 py-2 text-sm leading-relaxed',
          isPlayer
            ? 'bg-primary/20 border border-primary/30 text-foreground'
            : 'bg-secondary border border-white/10 text-foreground/90'
        )}
      >
        {!isPlayer && (
          <div className="text-[10px] text-muted-foreground mb-1 font-medium">
            {message.nationName}
          </div>
        )}
        {message.text}
      </div>
    </div>
  );
}

export default function DiplomacyPanel({ nations = [], playerNation, selectedNation, onSelectNation }) {
  const [activeNation, setActiveNation] = useState(selectedNation || nations[0]);
  const [messages, setMessages] = useState({});
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (selectedNation) setActiveNation(selectedNation);
  }, [selectedNation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeNation]);

  const currentMessages = activeNation ? (messages[activeNation.id] || []) : [];

  const handleSend = async () => {
    if (!inputText.trim() || !activeNation) return;

    const userMsg = { sender: 'player', text: inputText.trim() };
    setMessages((prev) => ({
      ...prev,
      [activeNation.id]: [...(prev[activeNation.id] || []), userMsg],
    }));
    setInputText('');
    setIsTyping(true);

    // Simulate AI nation response
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const responses = generateDiplomaticResponse(activeNation, inputText, playerNation);
    const aiMsg = { sender: 'nation', nationName: activeNation.name, text: responses };
    setMessages((prev) => ({
      ...prev,
      [activeNation.id]: [...(prev[activeNation.id] || []), aiMsg],
    }));
    setIsTyping(false);
  };

  const handleQuickAction = (action) => {
    const templates = {
      trade: `We propose a mutually beneficial trade agreement between our nations, focusing on strategic goods and technology exchange.`,
      alliance: `We extend an offer of formal alliance, pledging mutual defense and cooperation in international affairs.`,
      demand: `We formally demand immediate action regarding the tensions between our nations. Failure to comply will have consequences.`,
      sanction: `Due to ongoing disputes, we are imposing economic sanctions until our conditions are met.`,
    };
    setInputText(templates[action.id] || '');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Nation list */}
      <div className="glass-panel rounded-t-xl border-b border-white/10 p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          Foreign Relations
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {nations.map((nation) => (
            <button
              key={nation.id}
              onClick={() => { setActiveNation(nation); onSelectNation?.(nation); }}
              className={cn(
                'flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all text-xs',
                activeNation?.id === nation.id
                  ? 'bg-primary/20 border-primary/40 text-foreground'
                  : 'border-white/10 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <span className="text-base">🏛</span>
              <span className="font-medium truncate max-w-[70px]">{nation.name.split(' ')[0]}</span>
              <span
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded border',
                  RELATION_BADGES[nation.relation]
                )}
              >
                {nation.relation}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {activeNation ? (
        <>
          {/* Nation header */}
          <div className="glass-panel px-4 py-2.5 flex items-center justify-between border-b border-white/10">
            <div>
              <div className="font-semibold text-sm">{activeNation.name}</div>
              <div className={cn('text-xs capitalize', RELATION_COLORS[activeNation.relation])}>
                {activeNation.relation} • {activeNation.power} power
              </div>
            </div>
            <div className="flex gap-1.5">
              {DIPLOMATIC_ACTIONS.slice(0, 2).map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className="text-[10px] px-2 py-1 rounded border border-white/10 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Open diplomatic channel with {activeNation.name}</p>
                <p className="text-xs mt-1 opacity-60">Your words carry the weight of a nation</p>
              </div>
            )}
            {currentMessages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-secondary border border-white/10">
                  🏛
                </div>
                <div className="bg-secondary border border-white/10 rounded-xl px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="glass-panel rounded-b-xl p-3 border-t border-white/10">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Send a diplomatic message..."
                className="flex-1 bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 text-foreground placeholder-muted-foreground"
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="self-end p-2.5 bg-primary/20 border border-primary/30 rounded-lg text-primary hover:bg-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a nation to open diplomatic channel
        </div>
      )}
    </div>
  );
}

function generateDiplomaticResponse(nation, playerMessage, playerNation) {
  const tone = nation.relation;
  const responses = {
    ally: [
      `We value our partnership deeply. Your proposal aligns with our mutual interests and we are open to further discussion.`,
      `As trusted allies, we welcome this initiative. Our nations stand stronger together.`,
      `Your words reflect the spirit of our alliance. We shall consult our council and respond formally.`,
    ],
    friendly: [
      `Your message has been received with interest. We see potential in deepening our cooperation.`,
      `We appreciate the diplomatic approach. Let us explore this opportunity through proper channels.`,
    ],
    neutral: [
      `Your communiqué has been noted. We will deliberate this matter carefully before responding.`,
      `The interests of our nation remain our priority. We will consider your proposal with due diligence.`,
    ],
    rival: [
      `We find your proposition... ambitious. Our current relations would require significant goodwill gestures before such discussions.`,
      `Do not mistake our measured response for weakness. We are watching.`,
    ],
    enemy: [
      `Your audacity in contacting us directly is noted. There is nothing to discuss until your nation ceases its hostile actions.`,
      `We do not negotiate under duress. Stand down or face consequences.`,
    ],
  };
  const pool = responses[tone] || responses.neutral;
  return pool[Math.floor(Math.random() * pool.length)];
}

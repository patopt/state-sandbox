'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const QUICK_QUESTIONS = [
  'What should I prioritize this year?',
  'How can I improve the economy?',
  'How can I strengthen the military?',
  'What are the biggest threats?',
  'How to improve citizen happiness?',
];

function Message({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : '')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-primary/20 border border-primary/30">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-3 py-2.5 text-sm',
          isUser
            ? 'bg-primary/20 border border-primary/30 text-foreground'
            : 'bg-secondary border border-white/10 text-foreground/90'
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed"
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-none space-y-0.5 my-1">{children}</ul>,
              li: ({ children }) => (
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">›</span>
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function AdvisorChat({ stateId, events = [] }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'I am your strategic advisor. Ask me anything about your nation\'s current situation, upcoming events, or request policy recommendations.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.getStateAdvice(stateId, text, events);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.markdownAdvice || 'No advice available.' },
      ]);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Advisor unavailable',
        description: 'Could not reach your advisor. Try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="glass-panel rounded-t-xl px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">Strategic Advisor</div>
            <div className="text-[10px] text-muted-foreground">AI-powered strategic counsel</div>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <Message key={i} message={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-primary/20 border border-primary/30">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
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

      {/* Quick questions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="glass-panel rounded-b-xl p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your advisor..."
            className="flex-1 bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder-muted-foreground"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-primary/20 border border-primary/30 rounded-lg text-primary hover:bg-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

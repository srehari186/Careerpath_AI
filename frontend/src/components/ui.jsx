import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/* ---------- Navigation ---------- */
export function Nav() {
  const { pathname } = useLocation();
  const link = (to, label) => (
    <Link
      key={to}
      to={to}
      className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
        pathname === to ? 'text-white bg-white/15' : 'text-indigo-200 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#12133a]/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2.5 mr-4">
          <img src="/logo.svg" alt="CareerPath AI logo" className="w-9 h-9 rounded-xl shadow-lift" />
          <span className="font-display font-700 font-bold text-white text-lg tracking-tight">CareerPath <span className="gradient-text">AI</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {link('/assessment', 'Assessment')}
          {link('/assistant', 'AI Assistant')}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-300/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ML + RAG live
          </span>
          <Link to="/assessment" className="text-sm font-semibold text-[#12133a] bg-white hover:bg-indigo-50 px-4 py-2 rounded-xl transition shadow">
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Layout primitives ---------- */
export function Page({ children, wide }) {
  return <div className={`mx-auto px-5 py-8 space-y-6 ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}>{children}</div>;
}

export function Card({ children, className = '', hover = false }) {
  return (
    <div className={`bg-white rounded-2xl shadow-card border border-slate-100 p-5 ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function SectionHead({ eyebrow, title, sub, dark = false }) {
  return (
    <div className="space-y-2">
      {eyebrow && (
        <p className={`text-xs font-bold uppercase tracking-[0.18em] ${dark ? 'text-fuchsia-300' : 'text-indigo-600'}`}>{eyebrow}</p>
      )}
      <h2 className={`font-display text-3xl md:text-4xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      {sub && <p className={`text-[15px] leading-relaxed ${dark ? 'text-indigo-200' : 'text-slate-500'}`}>{sub}</p>}
    </div>
  );
}

export function Footer() {
  return (
    <div className="mt-10 border-t border-slate-200 pt-6 pb-2 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-slate-400">
      <p>CareerPath AI · ML ranking + RAG-grounded roadmaps · training data is synthetic (see README)</p>
      <p>ML predicts · RAG explains · KB grounds every fact</p>
    </div>
  );
}

/* ---------- Bits ---------- */
export function Pill({ children, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold border px-2.5 py-1 rounded-full ${tones[tone] || tones.indigo}`}>{children}</span>;
}

export function MatchBar({ pct, gradient = 'from-indigo-500 via-violet-500 to-fuchsia-500' }) {
  return (
    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${gradient} anim-bar`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CheckIcon({ className = 'w-4 h-4 text-emerald-500 shrink-0 mt-0.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
      <path d="M6.5 10.2l2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Chip({ active, onClick, children, activeClass = 'bg-indigo-600 text-white border-indigo-600 shadow-lift' }) {
  return (
    <button
      onClick={onClick}
      className={`chip-btn text-sm font-medium px-3.5 py-1.5 rounded-full border ${
        active ? activeClass : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
      }`}
    >
      {children}
    </button>
  );
}

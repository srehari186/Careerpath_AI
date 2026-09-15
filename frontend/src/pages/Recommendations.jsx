import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page, SectionHead, MatchBar, CheckIcon, Footer } from '../components/ui';

const MEDALS = ['from-amber-400 to-orange-500', 'from-slate-300 to-slate-400', 'from-orange-300 to-amber-500'];

export default function Recommendations() {
  const nav = useNavigate();
  const data = JSON.parse(sessionStorage.getItem('recs') || 'null');
  if (!data) {
    return (
      <Page>
        <div className="bg-white rounded-3xl border p-12 text-center space-y-4">
          <p className="font-display text-2xl font-bold">No results yet</p>
          <p className="text-slate-500 text-sm">Take the 60-second assessment to get your ML-ranked careers.</p>
          <Link to="/assessment" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl">Take assessment</Link>
        </div>
      </Page>
    );
  }
  const go = (role) => { sessionStorage.setItem('target', role); nav('/pathway'); };
  const max = Math.max(...data.recommended_careers.map(c => c.score));

  return (
    <Page wide>
      <SectionHead
        eyebrow="Step 2 of 3 · Recommendations"
        title="Your recommended career paths"
        sub="Bars show the trained classifier's match probability. Reasons map your strongest skills and interests onto each role's requirements — facts grounded in the knowledge base."
      />
      <div className="grid md:grid-cols-2 gap-5">
        {data.recommended_careers.map((c, i) => {
          const pct = Math.round(c.score * 100);
          const rel = max ? Math.round((c.score / max) * 100) : pct;
          return (
            <div key={c.role} className={`relative bg-white rounded-3xl border p-6 card-hover anim-fade-up anim-d${Math.min(i, 4)} ${i === 0 ? 'border-indigo-200 ring-2 ring-indigo-100 shadow-lift' : 'border-slate-100 shadow-card'}`}>
              {i === 0 && (
                <span className="absolute -top-3 left-6 text-[11px] font-bold uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1 rounded-full shadow">Best match</span>
              )}
              <div className="flex items-start gap-3">
                <span className={`grid place-items-center w-10 h-10 rounded-2xl text-white font-display font-bold bg-gradient-to-br ${MEDALS[i] || 'from-indigo-500 to-violet-500'}`}>#{i + 1}</span>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold leading-tight">{c.role}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ML score {c.score.toFixed(3)} · KB source: {c.sources?.[0] || c.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl font-bold bg-gradient-to-br from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">{pct}%</p>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">match</p>
                </div>
              </div>
              <div className="mt-4"><MatchBar pct={rel} /></div>
              <ul className="mt-4 space-y-1.5">
                {c.reason.map((r, j) => (
                  <li key={j} className="flex gap-2 text-sm text-slate-600"><CheckIcon /><span>{r}</span></li>
                ))}
              </ul>
              <div className="mt-5 flex gap-2">
                <button onClick={() => go(c.role)} className="flex-1 font-semibold text-sm text-white bg-slate-900 hover:bg-indigo-600 px-4 py-2.5 rounded-xl transition">View pathway</button>
                <Link to={`/career/${encodeURIComponent(c.role)}`} className="text-sm font-semibold border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 px-4 py-2.5 rounded-xl transition">Details</Link>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-slate-400">Not seeing your dream role? <Link to="/assistant" className="text-indigo-600 font-semibold underline">Ask the AI assistant</Link> or browse all roles from the home page strip.</p>
      <Footer />
    </Page>
  );
}

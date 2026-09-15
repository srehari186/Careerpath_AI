import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page, Card, Pill, Footer } from '../components/ui';
import { api } from '../services/api';

const STAGE_STYLE = [
  { dot: 'bg-indigo-500', ring: 'ring-indigo-100', chip: 'Foundation' },
  { dot: 'bg-violet-500', ring: 'ring-violet-100', chip: 'Growth' },
  { dot: 'bg-fuchsia-500', ring: 'ring-fuchsia-100', chip: 'Proof' },
  { dot: 'bg-cyan-500', ring: 'ring-cyan-100', chip: 'Destination' },
];

function Row({ label, items, tone, doneSet }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {items.map(x => doneSet?.has(x)
          ? <span key={x} className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500 text-white px-2.5 py-1 rounded-full">✓ {x} · done</span>
          : <Pill key={x} tone={tone}>{x}</Pill>)}
      </div>
    </div>
  );
}

const heldCerts = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem('profile') || '{}').certifications || []); }
  catch { return new Set(); }
};

export default function Pathway() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
    const target = sessionStorage.getItem('target');
    if (!target) { setErr('No target role selected. Pick one from your recommendations first.'); return; }
    api.pathway(profile, target).then(setData).catch(e => setErr(e.response?.data?.detail || e.message));
  }, []);
  if (err) {
    return <Page><div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-sm">{err} <Link to="/recommendations" className="underline font-semibold">Back to recommendations</Link></div></Page>;
  }
  if (!data) {
    return (
      <Page>
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex gap-1.5"><span className="typing-dot w-2 h-2 rounded-full bg-indigo-500 inline-block" /><span className="typing-dot w-2 h-2 rounded-full bg-indigo-500 inline-block" /><span className="typing-dot w-2 h-2 rounded-full bg-indigo-500 inline-block" /></span>
          Building your personalized roadmap from the knowledge base…
        </div>
      </Page>
    );
  }
  const p = data.career_pathway;
  const held = heldCerts();
  const earnedHere = (p.certifications || []).filter(c => held.has(c)).length;
  const total = (p.current_skills?.length || 0) + (p.missing_skills?.length || 0);
  const covered = total ? Math.round(((p.current_skills?.length || 0) / total) * 100) : 0;

  return (
    <div className="-mt-8">
      <div className="bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-28 left-10 w-96 h-96 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-5 pt-12 pb-8 anim-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">Step 3 of 3 · Your roadmap</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-2">{p.target_role}</h2>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white glass-dark px-3 py-1.5 rounded-full">Level: <span className="text-cyan-300">{p.current_level}</span></span>
            {data.ml_score != null && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white glass-dark px-3 py-1.5 rounded-full">ML match <span className="text-fuchsia-300">{Math.round(data.ml_score * 100)}%</span></span>}
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-100 glass-dark px-3 py-1.5 rounded-full">Grounded in KB: {p.sources?.[0]?.role}</span>
            {held.size > 0 && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white glass-dark px-3 py-1.5 rounded-full">✓ <span className="text-emerald-300">{earnedHere}/{p.certifications?.length || 0} certs earned</span></span>}
          </div>
          <div className="mt-5 max-w-md">
            <div className="flex justify-between text-xs font-semibold text-indigo-200 mb-1.5"><span>Required skills covered</span><span>{covered}%</span></div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 anim-bar" style={{ width: `${covered}%` }} />
            </div>
          </div>
        </div>
      </div>

      <Page>
        <div className="grid md:grid-cols-2 gap-4 -mt-2">
          <Card className="border-emerald-100">
            <h3 className="font-display font-bold text-emerald-700">Current skills · {p.current_skills.length}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">{p.current_skills.length ? p.current_skills.map(s => <Pill key={s} tone="emerald">{s}</Pill>) : <span className="text-sm text-slate-400">None yet — your roadmap starts from zero.</span>}</div>
          </Card>
          <Card className="border-rose-100">
            <h3 className="font-display font-bold text-rose-600">Missing skills · {p.missing_skills.length}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">{p.missing_skills.length ? p.missing_skills.map(s => <Pill key={s} tone="rose">{s}</Pill>) : <span className="text-sm text-slate-400">None — you already cover the core.</span>}</div>
          </Card>
        </div>

        {/* Timeline */}
        <div className="relative pl-12 space-y-4">
          <div className="timeline-rail" />
          {p.roadmap.map((s, i) => {
            const st = STAGE_STYLE[i % STAGE_STYLE.length];
            return (
              <div key={s.stage} className={`relative bg-white rounded-2xl border border-slate-100 shadow-card p-5 anim-fade-up anim-d${Math.min(i, 4)}`}>
                <span className={`absolute -left-12 top-5 w-10 h-10 rounded-full ${st.dot} ring-8 ${st.ring} grid place-items-center text-white font-display font-bold shadow`}>{s.stage}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-bold text-lg">{s.title}</h3>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">· {st.chip}</span>
                </div>
                <Row label="Skills" items={s.skills} tone="indigo" />
                <Row label="Technologies" items={s.technologies} tone="cyan" />
                <Row label="Projects" items={s.projects} tone="amber" />
                <Row label="Certifications" items={s.certifications} tone="emerald" doneSet={held} />
                {s.progression?.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm font-semibold text-indigo-700">
                    {s.progression.map((r, j) => (
                      <span key={r} className="flex items-center gap-1.5">
                        {j > 0 && <span className="text-slate-300">→</span>}
                        <span className={`px-2.5 py-1 rounded-lg ${r === p.target_role ? 'bg-indigo-600 text-white' : 'bg-indigo-50'}`}>{r}</span>
                      </span>
                    ))}
                  </div>
                )}
                {s.resources?.length > 0 && <p className="text-xs text-slate-400 mt-2">Learn: {s.resources.join(' · ')}</p>}
              </div>
            );
          })}
        </div>

        <Card className="bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50">
          <h3 className="font-display font-bold">Full progression ladder</h3>
          <p className="text-indigo-700 font-semibold mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
            {p.career_progression.map((r, j) => (
              <span key={r} className="flex items-center gap-1.5">{j > 0 && <span className="text-slate-300">→</span>}{r}</span>
            ))}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
            <p><span className="font-bold">Stack:</span> <span className="text-slate-600">{p.technologies.join(', ')}</span></p>
            <p><span className="font-bold">Certs:</span> <span className="text-slate-600">{p.certifications.map((c, i) => <span key={c}>{i > 0 && ' · '}{held.has(c) ? `✓ ${c}` : c}</span>)}</span></p>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">{p.grounding_note}</p>
        </Card>
        <Footer />
      </Page>
    </div>
  );
}

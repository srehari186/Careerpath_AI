import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Page, Card, Pill, Footer } from '../components/ui';
import { api } from '../services/api';

function Block({ title, items, tone, ordered = false }) {
  if (!items?.length) return null;
  return (
    <Card hover>
      <h3 className="font-display font-bold mb-2.5">{title}</h3>
      {ordered ? (
        <ol className="space-y-1.5 text-sm text-slate-600">{items.map((x, i) => <li key={x} className="flex gap-2"><span className="font-bold text-indigo-500">{i + 1}.</span>{x}</li>)}</ol>
      ) : (
        <div className="flex flex-wrap gap-1.5">{items.map(x => <Pill key={x} tone={tone}>{x}</Pill>)}</div>
      )}
    </Card>
  );
}

export default function CareerDetail() {
  const { name } = useParams();
  const [d, setD] = useState(null);
  useEffect(() => { api.career(decodeURIComponent(name)).then(setD).catch(() => setD({ error: true })); }, [name]);
  if (!d) return <Page><p className="text-slate-400">Loading career profile…</p></Page>;
  if (d.error) return <Page><p>Career not found. <Link to="/" className="underline text-indigo-600">Home</Link></p></Page>;

  return (
    <div className="-mt-8">
      <div className="mesh-hero text-white">
        <div className="max-w-5xl mx-auto px-5 pt-12 pb-8 anim-fade-up">
          <Link to="/recommendations" className="text-xs font-semibold text-indigo-200 hover:text-white">← Back to recommendations</Link>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-3">{d.career_role}</h2>
          <p className="text-indigo-100/90 mt-3 max-w-2xl leading-relaxed">{d.description}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="glass-dark text-xs font-semibold px-3 py-1.5 rounded-full">Prerequisites: {d.prerequisites?.join?.(', ') || d.prerequisites}</span>
          </div>
        </div>
      </div>
      <Page>
        <div className="grid md:grid-cols-2 gap-4">
          <Block title="Required skills" items={d.required_skills} tone="indigo" />
          <Block title="Preferred skills" items={d.preferred_skills} tone="cyan" />
          <Block title="Programming languages" items={d.programming_languages} tone="amber" />
          <Block title="Technologies" items={d.technologies} tone="cyan" />
          <Block title="Tools" items={d.tools} tone="slate" />
          <Block title="Certifications" items={d.certifications} tone="emerald" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Block title="Start here" items={d.beginner_skills} tone="indigo" />
          <Block title="Level up" items={d.intermediate_skills} tone="amber" />
          <Block title="Go advanced" items={d.advanced_skills} tone="rose" />
        </div>
        <Block title="Portfolio projects" items={d.projects} tone="amber" ordered />
        <Card className="bg-slate-900 text-white border-slate-900">
          <h3 className="font-display font-bold">Career progression</h3>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-semibold">
            {d.career_progression.map((r, j) => (
              <span key={r} className="flex items-center gap-1.5">
                {j > 0 && <span className="text-slate-500">→</span>}
                <span className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg">{r}</span>
              </span>
            ))}
          </p>
          <p className="text-xs text-slate-400 mt-3">Related: {d.related_roles?.join(' · ')} — Learn: {d.learning_resources?.join(' · ')}</p>
        </Card>
        <Footer />
      </Page>
    </div>
  );
}

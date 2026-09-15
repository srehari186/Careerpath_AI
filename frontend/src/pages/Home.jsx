import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page, Footer } from '../components/ui';
import { api } from '../services/api';

const STEPS = [
  { n: '01', title: 'Assess', text: 'Share your education, skills, interests and experience in under a minute.', grad: 'from-indigo-500 to-violet-500' },
  { n: '02', title: 'ML ranking', text: 'A trained Random Forest scores all 20 roles and explains every match.', grad: 'from-violet-500 to-fuchsia-500' },
  { n: '03', title: 'Skill gap', text: 'Your skills are diffed against each role\u2019s required skill set.', grad: 'from-fuchsia-500 to-rose-500' },
  { n: '04', title: 'RAG roadmap', text: 'Grounded pathways: stages, tech, certs, projects and progression.', grad: 'from-cyan-500 to-indigo-500' },
];

export default function Home() {
  const [roles, setRoles] = useState([]);
  useEffect(() => { api.careers().then(d => setRoles(d.roles)).catch(() => {}); }, []);

  return (
    <div className="-mt-8">
      {/* HERO */}
      <div className="mesh-hero text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-14 md:pt-24 md:pb-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="anim-fade-up">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="glass-dark text-xs font-semibold px-3 py-1.5 rounded-full">Trained ML model</span>
              <span className="glass-dark text-xs font-semibold px-3 py-1.5 rounded-full">Grounded RAG</span>
              <span className="glass-dark text-xs font-semibold px-3 py-1.5 rounded-full">20 career roles</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.04] tracking-tight flex items-center gap-4">
              <img src="/logo.svg" alt="CareerPath AI logo" className="w-14 h-14 md:w-16 md:h-16 rounded-2xl shadow-lift" />
              <span>CareerPath <span className="gradient-text">AI</span></span>
            </h1>
            <p className="mt-5 text-lg text-indigo-100/90 leading-relaxed max-w-lg">
              Discover the career path that matches your skills, interests and goals — ranked by machine learning, explained by retrieval-grounded AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/assessment" className="font-semibold text-[#17143c] bg-white hover:bg-indigo-50 px-7 py-3.5 rounded-2xl transition shadow-lift">
                Explore My Career Path
              </Link>
              <Link to="/assistant" className="font-semibold glass-dark hover:bg-white/15 px-7 py-3.5 rounded-2xl transition">
                Ask the AI assistant
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 max-w-md gap-4">
              {[['20', 'career roles'], ['20', 'knowledge docs'], ['6', 'app pages']].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-2xl md:text-3xl font-bold">{v}</p>
                  <p className="text-xs text-indigo-200">{l}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Visual card */}
          <div className="anim-fade-up anim-d2 hidden md:block">
            <div className="anim-float glass-dark rounded-3xl p-6 space-y-4 shadow-lift">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Live prediction preview</p>
              {[['Data Scientist', 89, 'from-indigo-400 to-violet-400'], ['ML Engineer', 82, 'from-violet-400 to-fuchsia-400'], ['Data Analyst', 76, 'from-fuchsia-400 to-cyan-300']].map(([r, s, g]) => (
                <div key={r} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>{r}</span><span className="text-indigo-200">{s}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${g}`} style={{ width: `${s}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-indigo-200/80">Scores from the trained classifier · reasons grounded in the knowledge base</p>
            </div>
          </div>
        </div>
        {/* role marquee strip */}
        <div className="border-t border-white/10 bg-black/20">
          <div className="max-w-6xl mx-auto px-5 py-3 flex gap-2 overflow-x-auto text-xs font-medium text-indigo-100/80 whitespace-nowrap">
            {(roles.length ? roles : ['Data Scientist', 'ML Engineer', 'Full Stack Developer', 'Cloud Engineer', 'Cybersecurity Analyst', 'Data Engineer', 'DevOps Engineer', 'UI/UX Designer']).map(r => (
              <span key={r} className="border border-white/10 rounded-full px-3 py-1">{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <Page wide>
        <div className="grid md:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`bg-white rounded-2xl border border-slate-100 shadow-card p-5 card-hover anim-fade-up anim-d${i}`}>
              <span className={`inline-grid place-items-center w-10 h-10 rounded-xl text-white font-display font-bold bg-gradient-to-br ${s.grad}`}>{s.n}</span>
              <h3 className="font-display font-bold text-lg mt-3">{s.title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white p-8 md:p-10 text-center shadow-lift">
          <h3 className="font-display text-2xl md:text-3xl font-bold">Your roadmap is one assessment away</h3>
          <p className="text-indigo-100 mt-2 text-sm">60 seconds · 20 roles ranked · personalized stages, projects and certs</p>
          <Link to="/assessment" className="inline-block mt-6 bg-white text-indigo-700 font-bold px-8 py-3 rounded-2xl hover:bg-indigo-50 transition">Start my assessment</Link>
        </div>
        <Footer />
      </Page>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Footer } from '../components/ui';
import { api, INTERESTS } from '../services/api';

/* ---------- data ---------- */
const STEPS = ['Background', 'Skills', 'Interests', 'Certifications', 'Review'];
const REVIEW = 4;

const EXP_TILES = [
  ['Fresher', '0–1 yrs · starting out'], ['Intermediate', '2–4 yrs · hands-on'],
  ['Experienced', '5+ yrs · seasoned'],
];
/* starter topics auto-selected per experience level (first-N topics of each skill) */
const EXP_DEFAULTS = {
  Fresher: { Python: 3, SQL: 2 },
  Intermediate: { Python: 5, SQL: 4, Statistics: 3, 'Problem Solving': 2 },
  Experienced: { Python: 6, SQL: 5, 'Machine Learning': 4, 'Problem Solving': 3 },
};

/* What you have DONE inside each skill — level is derived from completed topics */
const SKILL_TOPICS = {
  Python: ['Syntax & I/O', 'Conditionals & Loops', 'Functions', 'Lists, Dicts & Sets', 'OOP', 'Modules & Files'],
  Java: ['Syntax & OOP basics', 'Collections', 'Exception Handling', 'Streams & Lambdas', 'JVM & Memory basics'],
  'C++': ['Pointers', 'OOP', 'STL', 'Memory Management', 'Recursion'],
  JavaScript: ['DOM Manipulation', 'ES6+', 'Async & Promises', 'Functions & Closures', 'Fetch & APIs'],
  SQL: ['SELECT & Filtering', 'Joins', 'Aggregation', 'Subqueries', 'Window Functions'],
  Statistics: ['Descriptive Stats', 'Probability', 'Distributions', 'Hypothesis Testing'],
  'Machine Learning': ['Regression', 'Classification', 'Clustering', 'Model Evaluation', 'Feature Engineering'],
  'Data Analysis': ['Pandas', 'Data Cleaning', 'Visualization', 'Exploratory Analysis'],
  Cloud: ['Virtual Machines', 'Storage', 'IAM Basics', 'Deploying Apps'],
  'Web Development': ['HTML & CSS', 'Responsive Design', 'REST APIs', 'Auth Basics'],
  Cybersecurity: ['Networking Basics', 'OWASP Top 10', 'Cryptography Basics', 'Security Tools'],
  Communication: ['Presentations', 'Documentation', 'Team Collaboration'],
  'Problem Solving': ['Arrays & Strings', 'Recursion', 'Sorting & Searching', 'DSA Basics'],
};
const SKILL_CAT = {
  Python: 'Languages', Java: 'Languages', 'C++': 'Languages', JavaScript: 'Languages', SQL: 'Languages',
  Statistics: 'Data & AI', 'Machine Learning': 'Data & AI', 'Data Analysis': 'Data & AI',
  Cloud: 'Engineering', 'Web Development': 'Engineering', Cybersecurity: 'Engineering',
  Communication: 'Soft', 'Problem Solving': 'Soft',
};
const SKILL_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Languages', label: 'Languages' },
  { id: 'Data & AI', label: 'Data & AI' },
  { id: 'Engineering', label: 'Engineering' },
  { id: 'Soft', label: 'Soft skills' },
];
const ALL_SKILLS = Object.keys(SKILL_TOPICS);

const INTEREST_BLURB = {
  AI: 'Robots that learn', Data: 'Stories in numbers', Web: 'Build for browsers',
  Cloud: 'Scale in the sky', Security: 'Think like an attacker', Embedded: 'Code meets hardware',
};

/* level 1–10 derived from share of completed topics */
const levelFor = (skill, doneTopics) => {
  const total = SKILL_TOPICS[skill]?.length || 1;
  const done = (doneTopics || []).length;
  return Math.max(1, Math.round((done / total) * 10));
};

/* ---------- bits ---------- */
function Tile({ active, onClick, children, className = '' }) {
  return (
    <button onClick={onClick}
      className={`text-left rounded-2xl border-2 p-4 transition-all duration-150 active:scale-[0.98] ${
        active
          ? 'border-transparent bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lift'
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-card'
      } ${className}`}>
      {children}
    </button>
  );
}

/* ---------- main ---------- */
export default function Assessment() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState([true, false, false, false, false]);
  const [form, setForm] = useState({
    education: "Bachelor's", experience: 'Fresher', domain: 'General',
    skills: ['Python', 'SQL'], interests: ['AI', 'Data'], certifications: [],
    skill_topics: { Python: ['Syntax & I/O', 'Conditionals & Loops', 'Functions'], SQL: ['SELECT & Filtering', 'Joins'] },
  });
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [certQuery, setCertQuery] = useState('');
  const [kbCerts, setKbCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { api.certifications().then(d => setKbCerts(d.certifications)).catch(() => {}); }, []);

  const go = (n) => { setStep(n); setVisited(v => v.map((x, i) => x || i <= n)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const levelOf = (s) => levelFor(s, form.skill_topics[s]);
  const toggleSkill = (s) => setForm(f => {
    const has = f.skills.includes(s);
    const skill_topics = { ...f.skill_topics };
    if (has) delete skill_topics[s]; else skill_topics[s] = [];
    return { ...f, skills: has ? f.skills.filter(x => x !== s) : [...f.skills, s], skill_topics };
  });
  const toggleTopic = (skill, topic) => setForm(f => {
    const cur = f.skill_topics[skill] || [];
    const next = cur.includes(topic) ? cur.filter(t => t !== topic) : [...cur, topic];
    return { ...f, skill_topics: { ...f.skill_topics, [skill]: next } };
  });
  const toggleInterest = (s) => setForm(f => ({ ...f, interests: f.interests.includes(s) ? f.interests.filter(x => x !== s) : [...f.interests, s] }));
  const toggleCert = (c) => setForm(f => ({ ...f, certifications: f.certifications.includes(c) ? f.certifications.filter(x => x !== c) : [...f.certifications, c] }));
  /* picking experience loads that level's starter skills + topics */
  const selectExperience = (v) => setForm(f => {
    const skill_topics = {};
    const skills = [];
    for (const [s, n] of Object.entries(EXP_DEFAULTS[v] || {})) {
      if (SKILL_TOPICS[s]) { skills.push(s); skill_topics[s] = SKILL_TOPICS[s].slice(0, n); }
    }
    return { ...f, experience: v, skills, skill_topics };
  });

  const visibleSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_SKILLS.filter(s =>
      (tab === 'all' || SKILL_CAT[s] === tab) &&
      (!q || s.toLowerCase().includes(q) || (SKILL_TOPICS[s] || []).some(t => t.toLowerCase().includes(q))));
  }, [tab, query]);

  const visibleCerts = useMemo(() => {
    const q = certQuery.trim().toLowerCase();
    if (!q) return kbCerts;
    return kbCerts.filter(c => c.certification.toLowerCase().includes(q) || c.roles.some(r => r.toLowerCase().includes(q)));
  }, [kbCerts, certQuery]);

  const avg = form.skills.length
    ? (form.skills.reduce((a, s) => a + levelOf(s), 0) / form.skills.length).toFixed(1) : '—';
  const totalTopics = form.skills.reduce((a, s) => a + (form.skill_topics[s] || []).length, 0);

  const submit = async () => {
    setLoading(true); setErr('');
    try {
      const skill_levels = {};
      form.skills.forEach(s => { skill_levels[s] = levelOf(s); });
      const payload = { education: form.education, experience: form.experience, domain: form.domain,
        skills: form.skills, interests: form.interests, certifications: form.certifications, skill_levels };
      const data = await api.predict(payload);
      sessionStorage.setItem('profile', JSON.stringify(payload));
      sessionStorage.setItem('recs', JSON.stringify(data));
      nav('/recommendations');
    } catch (e) { setErr(e.response?.data?.detail || 'Backend unreachable. Start it with: uvicorn backend.main:app --port 8000'); }
    finally { setLoading(false); }
  };

  return (
    <Page wide>
      {/* header */}
      <div className="rounded-3xl bg-slate-900 text-white p-7 md:p-9 relative overflow-hidden">
        <div className="absolute -top-20 right-10 w-72 h-72 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">Career assessment · 5 quick steps</p>
        <h2 className="relative font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">Show us what you've actually done</h2>
        <p className="relative text-indigo-200 text-sm mt-2 max-w-xl">Pick your experience to load starter skills, then tick off completed topics and certifications — the model ranks all 20 careers.</p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* rail */}
        <div className="lg:sticky lg:top-20 bg-white rounded-2xl border border-slate-100 shadow-card p-4">
          <div className="flex lg:flex-col gap-1">
            {STEPS.map((s, i) => {
              const done = i < step || (i === REVIEW && form.skills.length > 0);
              const cur = i === step;
              return (
                <button key={s} onClick={() => visited[i] && go(i)} disabled={!visited[i]}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition flex-1 ${cur ? 'bg-indigo-50' : visited[i] ? 'hover:bg-slate-50' : 'opacity-40'}`}>
                  <span className={`grid place-items-center w-8 h-8 rounded-full text-sm font-display font-bold shrink-0 ${
                    cur ? 'bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow' : done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {done && !cur ? '✓' : `0${i + 1}`}
                  </span>
                  <span>
                    <span className={`block text-sm font-bold ${cur ? 'text-indigo-700' : 'text-slate-600'}`}>{s}</span>
                    <span className="hidden lg:block text-[11px] text-slate-400">
                      {i === 0 && form.experience}
                      {i === 1 && `${form.skills.length} skills · ${totalTopics} topics`}
                      {i === 2 && `${form.interests.length} interests`}
                      {i === 3 && `${form.certifications.length} earned`}
                      {i === REVIEW && 'Confirm & run'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* stage */}
        <div key={step} className="anim-fade-up min-h-[420px]">
          {step === 0 && (
            <div>
              <h3 className="font-display font-bold text-xl">How experienced are you?</h3>
              <p className="text-sm text-slate-400 mt-1">Each level loads its starter skills — refine them in the next step.</p>
              <div className="grid sm:grid-cols-3 gap-3 mt-3">
                {EXP_TILES.map(([v, hint]) => (
                  <Tile key={v} active={form.experience === v} onClick={() => selectExperience(v)}>
                    <p className="font-bold">{v}</p><p className={`text-xs mt-0.5 ${form.experience === v ? 'text-indigo-100' : 'text-slate-400'}`}>{hint}</p>
                    <p className={`text-[11px] mt-1.5 font-semibold ${form.experience === v ? 'text-indigo-200' : 'text-slate-400'}`}>
                      Starts with: {Object.keys(EXP_DEFAULTS[v] || {}).join(' · ')}
                    </p>
                  </Tile>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display font-bold text-xl mr-auto">What have you completed? <span className="text-indigo-600">· {form.skills.length} skills, {totalTopics} topics</span></h3>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search skills or topics…"
                  className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {SKILL_TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition ${tab === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {visibleSkills.map(s => {
                  const on = form.skills.includes(s);
                  const done = (form.skill_topics[s] || []).length;
                  const total = SKILL_TOPICS[s].length;
                  return (
                    <div key={s} onClick={() => toggleSkill(s)}
                      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all active:scale-[0.99] ${on ? 'border-indigo-500 bg-indigo-50/50 shadow-card' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`grid place-items-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition ${on ? 'bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{on ? '✓' : '+'}</span>
                        <p className="font-bold text-sm">{s}</p>
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-slate-400">{SKILL_CAT[s]}</span>
                      </div>
                      {on && (
                        <div className="mt-3" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between text-[11px] font-bold mb-1.5">
                            <span className="text-slate-500 uppercase tracking-wide">Tick completed topics</span>
                            <span className="text-indigo-600">{done}/{total} · level {levelOf(s)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-2.5">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all" style={{ width: `${(done / total) * 100}%` }} />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {SKILL_TOPICS[s].map(t => {
                              const ticked = (form.skill_topics[s] || []).includes(t);
                              return (
                                <button key={t} onClick={() => toggleTopic(s, t)}
                                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${ticked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                                  {ticked ? '✓ ' : ''}{t}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {visibleSkills.length === 0 && <p className="text-sm text-slate-400 mt-4">Nothing matches “{query}”.</p>}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-display font-bold text-xl">What excites you? <span className="text-emerald-600">· {form.interests.length}</span></h3>
              <p className="text-sm text-slate-400 mt-1">Pick the worlds you want to work in — the model weighs this heavily.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {INTERESTS.map(s => {
                  const on = form.interests.includes(s);
                  return (
                    <button key={s} onClick={() => toggleInterest(s)}
                      className={`rounded-2xl border-2 p-5 text-left transition-all active:scale-[0.98] ${on ? 'border-transparent bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lift' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                      <p className="font-display font-bold text-lg">{s}</p>
                      <p className={`text-xs mt-0.5 ${on ? 'text-emerald-50' : 'text-slate-400'}`}>{INTEREST_BLURB[s] || s}</p>
                      <p className={`text-xs font-bold mt-2 ${on ? 'text-white' : 'text-slate-300'}`}>{on ? '✓ Selected' : '+ Tap to add'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-auto">
                  <h3 className="font-display font-bold text-xl">Certifications earned <span className="text-amber-600">· {form.certifications.length}</span></h3>
                  <p className="text-sm text-slate-400 mt-1">Tick what you've completed — matched against each role on your pathway. Skip if none yet.</p>
                </div>
                <input value={certQuery} onChange={e => setCertQuery(e.target.value)} placeholder="Search certs or roles…"
                  className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {form.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {form.certifications.map(c => (
                    <button key={c} onClick={() => toggleCert(c)} title="Remove"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 pl-3 pr-2 py-1 rounded-full hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition">
                      {c} <span>✕</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-2.5 mt-4 max-h-[420px] overflow-y-auto chat-scroll pr-1">
                {visibleCerts.map(({ certification: c, roles }) => {
                  const on = form.certifications.includes(c);
                  return (
                    <button key={c} onClick={() => toggleCert(c)}
                      className={`rounded-2xl border-2 p-3.5 text-left transition-all active:scale-[0.99] ${on ? 'border-amber-400 bg-amber-50/70 shadow-card' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`grid place-items-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition ${on ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{on ? '✓' : '+'}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm leading-snug">{c}</p>
                          <p className="text-[11px] text-slate-400 truncate">Valued for: {roles.slice(0, 3).join(' · ')}{roles.length > 3 ? ` +${roles.length - 3}` : ''}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {visibleCerts.length === 0 && <p className="text-sm text-slate-400 mt-4">{kbCerts.length ? `Nothing matches “${certQuery}”.` : 'Loading certifications from the knowledge base…'}</p>}
            </div>
          )}

          {step === REVIEW && (
            <div>
              <h3 className="font-display font-bold text-xl">Review & launch</h3>
              <p className="text-sm text-slate-400 mt-1">Levels come straight from your completed topics.</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-5">
                  <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Background</p><button onClick={() => go(0)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button></div>
                  <p className="font-bold mt-2">{form.education} · {form.experience}</p>
                  <p className="text-sm text-slate-500">Domain: {form.domain}</p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-5">
                  <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Skills · avg {avg}</p><button onClick={() => go(1)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button></div>
                  <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto chat-scroll pr-1">
                    {form.skills.map(s => (
                      <div key={s} className="flex items-center gap-2 text-xs">
                        <span className="font-semibold w-28 truncate">{s}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${levelOf(s) * 10}%` }} />
                        </div>
                        <span className="text-slate-400 w-20 text-right">{(form.skill_topics[s] || []).length}/{SKILL_TOPICS[s].length} topics · {levelOf(s)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-5">
                  <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Interests</p><button onClick={() => go(2)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button></div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.interests.map(s => <span key={s} className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">{s}</span>)}
                  </div>
                  <div className="flex items-center justify-between mt-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Certifications · {form.certifications.length}</p><button onClick={() => go(3)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button></div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.certifications.length
                      ? form.certifications.map(c => <span key={c} className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">✓ {c}</span>)
                      : <span className="text-xs text-slate-400">None yet — fine, the roadmap will suggest some.</span>}
                  </div>
                </div>
                <button onClick={submit} disabled={loading || form.skills.length === 0}
                  className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white p-5 text-left hover:opacity-95 disabled:opacity-40 transition shadow-lift">
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Ready when you are</p>
                  <p className="font-display font-bold text-2xl mt-1">{loading ? 'Analyzing…' : 'Analyze My Career →'}</p>
                  <p className="text-xs text-indigo-200 mt-1">Ranks all 20 roles in seconds</p>
                </button>
              </div>
              {form.skills.length === 0 && <p className="text-sm text-amber-600 font-semibold mt-3">Add at least one skill in step 02 to continue.</p>}
              {err && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4 mt-3">{err}</div>}
            </div>
          )}

          {/* pager */}
          <div className="flex items-center gap-2 mt-8">
            {step > 0 && <button onClick={() => go(step - 1)} className="font-semibold text-sm border border-slate-200 bg-white px-6 py-2.5 rounded-xl hover:border-indigo-400 hover:text-indigo-700 transition">← Back</button>}
            {step < REVIEW && <button onClick={() => go(step + 1)} className="ml-auto font-bold text-sm text-white bg-slate-900 px-8 py-2.5 rounded-xl hover:bg-indigo-600 transition">Continue →</button>}
          </div>
        </div>
      </div>
      <Footer />
    </Page>
  );
}

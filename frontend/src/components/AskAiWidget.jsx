import React, { useRef, useState } from 'react';
import { api, SUGGESTED_QUESTIONS } from '../services/api';

/* Floating Ask-AI widget: RAG chatbot available on every page. */
export default function AskAiWidget() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState([
    { q: null, a: 'Hi! Ask me anything about careers, skills, or roadmaps — I answer from the knowledge base with sources.' },
  ]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  const send = async (text) => {
    const question = (text ?? q).trim();
    if (!question || loading) return;
    if (!open) setOpen(true);
    setQ(''); setLoading(true);
    try {
      const r = await api.chat(question);
      setMsgs(m => [...m, { q: question, a: r.answer, sources: r.sources }]);
    } catch (e) {
      setMsgs(m => [...m, { q: question, a: 'Error: ' + (e.response?.data?.detail || 'backend unreachable') }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => { boxRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); });
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 left-4 sm:left-5 z-40 w-[380px] max-w-[calc(100vw-2rem)] anim-fade-up">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lift overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center gap-2.5">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </span>
              <p className="text-sm font-bold mr-auto">Ask AI <span className="font-normal text-slate-400">· grounded answers</span></p>
              <a href="/assistant" className="text-[11px] font-semibold text-indigo-300 hover:text-white">Full page →</a>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-lg leading-none px-1">✕</button>
            </div>
            <div ref={boxRef} className="chat-scroll h-[320px] overflow-y-auto p-3.5 space-y-3 bg-slate-50/70">
              {msgs.map((m, i) => (
                <div key={i}>
                  {m.q && (
                    <div className="flex justify-end mb-1.5">
                      <div className="max-w-[88%] bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-[13px] px-3 py-2 rounded-2xl rounded-br-md">{m.q}</div>
                    </div>
                  )}
                  <div className="flex justify-start">
                    <div className="max-w-[92%] bg-white border border-slate-100 text-[13px] text-slate-700 px-3 py-2.5 rounded-2xl rounded-bl-md shadow-card">
                      <pre className="whitespace-pre-wrap font-sans leading-relaxed">{m.a}</pre>
                      {m.sources?.length > 0 && (
                        <p className="text-[10px] font-semibold text-indigo-600 mt-1.5 pt-1.5 border-t border-slate-100">
                          {m.sources.map(s => `${s.role} (${s.score.toFixed(2)})`).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 px-3.5 py-2.5 rounded-2xl shadow-card flex gap-1.5">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-2.5 border-t border-slate-100 bg-white">
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {SUGGESTED_QUESTIONS.slice(0, 3).map(s => (
                  <button key={s} onClick={() => send(s)} className="whitespace-nowrap text-[11px] font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-2.5 py-1 rounded-full transition">{s}</button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Ask about careers…" maxLength={1000}
                  className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={() => send()} disabled={loading || !q.trim()}
                  className="font-bold text-[13px] text-white bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 px-4 rounded-xl transition">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} title="Ask AI"
        className={`fixed bottom-5 left-4 sm:left-5 z-40 group flex items-center gap-2 rounded-full pl-4 pr-5 py-3.5 font-bold text-white shadow-lift transition-all hover:scale-105 active:scale-95 ${
          open ? 'bg-slate-900' : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600'}`}>
        <span className="text-lg leading-none">{open ? '✕' : '✦'}</span>
        <span className="text-sm">{open ? 'Close' : 'Ask AI'}</span>
        {!open && (
          <span className="absolute -top-1 -left-1 flex w-3.5 h-3.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
            <span className="relative inline-flex w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
          </span>
        )}
      </button>
    </>
  );
}

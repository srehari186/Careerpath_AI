import React, { useRef, useState } from 'react';
import { Page, SectionHead, Footer } from '../components/ui';
import { api, SUGGESTED_QUESTIONS } from '../services/api';

export default function Assistant() {
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState([
    { q: null, a: 'Hi! I answer only from the 20-document career knowledge base — every reply cites its sources. Try a suggested question below.' },
  ]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  const send = async (text) => {
    const question = (text ?? q).trim();
    if (!question || loading) return;
    setQ(''); setLoading(true);
    try {
      const r = await api.chat(question);
      setMsgs(m => [...m, { q: question, a: r.answer, sources: r.sources }]);
    } catch (e) {
      setMsgs(m => [...m, { q: question, a: 'Error: ' + (e.response?.data?.detail || 'backend unreachable — start it on :8000') }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => { boxRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); });
    }
  };

  return (
    <Page>
      <SectionHead eyebrow="RAG chatbot" title="AI career assistant" sub="Retrieval first, generation second. Answers are composed only from retrieved KB documents, cited below each reply." />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center gap-3">
          <span className="relative flex w-2.5 h-2.5"><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" /><span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-400" /></span>
          <p className="text-sm font-semibold">Grounded assistant <span className="text-slate-400 font-normal">· cites KB sources</span></p>
        </div>

        <div ref={boxRef} className="chat-scroll h-[46vh] overflow-y-auto p-5 space-y-4 bg-slate-50/60">
          {msgs.map((m, i) => (
            <div key={i} className="anim-fade-up">
              {m.q && (
                <div className="flex justify-end mb-2">
                  <div className="max-w-[85%] bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md shadow">{m.q}</div>
                </div>
              )}
              <div className="flex justify-start">
                <div className="max-w-[90%] bg-white border border-slate-100 text-sm text-slate-700 px-4 py-3 rounded-2xl rounded-bl-md shadow-card">
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">{m.a}</pre>
                  {m.sources?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
                      {m.sources.map(s => (
                        <span key={s.role} className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{s.role} · {s.score.toFixed(2)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-card flex gap-1.5">
                <span className="typing-dot w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {SUGGESTED_QUESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} className="whitespace-nowrap text-xs font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition">{s}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about skills, roles, projects…" maxLength={1000}
            />
            <button onClick={() => send()} disabled={loading || !q.trim()}
              className="font-bold text-sm text-white bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 px-6 rounded-2xl transition">Send</button>
          </div>
        </div>
      </div>
      <Footer />
    </Page>
  );
}

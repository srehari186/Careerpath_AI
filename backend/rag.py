"""Grounded RAG: retrieval -> skill-gap -> structured pathway. No hallucinated facts: all
technologies/certs/progression come verbatim from retrieved KB docs."""
from pathlib import Path
import joblib
from backend.embeddings import Embedder
from backend.vector_store import VectorStore

BASE = Path(__file__).resolve().parent.parent
_vs = None; _emb = None

SKILL_ALIASES = {
    "python": "python_skill", "java": "java_skill", "c++": "cpp_skill", "cpp": "cpp_skill",
    "javascript": "javascript_skill", "js": "javascript_skill", "sql": "sql_skill",
    "statistics": "statistics_skill", "stats": "statistics_skill",
    "machine learning": "machine_learning_skill", "ml": "machine_learning_skill",
    "cloud": "cloud_skill", "aws": "cloud_skill", "azure": "cloud_skill",
    "web": "web_development_skill", "react": "web_development_skill",
    "data analysis": "data_analysis_skill", "cybersecurity": "cybersecurity_skill", "security": "cybersecurity_skill",
    "communication": "communication_skill", "problem solving": "problem_solving_skill",
}

def _load():
    global _vs, _emb
    if _vs is None:
        _vs, _emb = VectorStore(), Embedder()
        if not _vs.load():
            raise RuntimeError("Vector DB not built. Run: python scripts/build_vector_database.py")
    return _vs, _emb

def retrieve(query: str, k: int = 3):
    vs, emb = _load()
    qv = emb.encode([query])[0]
    return vs.search(qv, k=k)

def skill_gap(user_skills: list[str], required: list[str]):
    have = {s.strip().lower() for s in (user_skills or [])}
    current, missing = [], []
    for r in required:
        if r.lower() in have or any(r.lower() in h or h in r.lower() for h in have):
            current.append(r)
        else:
            missing.append(r)
    return current, missing

def explain_reasons(profile: dict, role_meta: dict) -> list[str]:
    """Explainable ML reasons: map user's top numeric skills/interests to role's required skills."""
    reasons = []
    feats = profile.get("numeric", {})
    # top user skills
    top = sorted(((k, v) for k, v in feats.items() if k.endswith("_skill")), key=lambda x: -x[1])[:4]
    inv = {v: k for k, v in SKILL_ALIASES.items()}
    req = [r.lower() for r in role_meta.get("required_skills", [])]
    for feat, val in top:
        if val >= 6:
            label = feat.replace("_skill", "").replace("_", " ").title()
            if any(feat.split("_")[0] in r for r in req):
                reasons.append(f"Strong {label} skills ({val}/10) match {role_meta['career_role']} requirements")
    for key in ("interest_ai", "interest_data", "interest_web", "interest_cloud", "interest_security", "interest_embedded"):
        if feats.get(key, 0) >= 7:
            reasons.append(f"High interest in {key.replace('interest_','')} aligns with this path")
    if not reasons:
        reasons.append(f"ML model ranked {role_meta['career_role']} highest from overall profile similarity")
    return reasons[:4]

def build_pathway(target_role: str, user_skills: list[str], profile: dict | None = None):
    vs, _ = _load()
    # exact KB match first
    match = next((d for d in vs.docs if d["metadata"].get("career_role", "").lower() == target_role.lower()), None)
    if match is None:  # fallback to retrieval
        hits = retrieve(target_role, k=1)
        if not hits:
            raise ValueError(f"Unknown career: {target_role}")
        match = hits[0]["doc"]
    m = match["metadata"]
    current, missing = skill_gap(user_skills, m.get("required_skills", []))
    level = "Beginner" if len(current) <= 2 else ("Intermediate" if len(current) <= 4 else "Advanced")
    roadmap = [
        {"stage": 1, "title": "Foundation", "skills": m.get("beginner_skills", []),
         "technologies": m.get("technologies", [])[:3], "resources": m.get("learning_resources", [])[:2]},
        {"stage": 2, "title": "Intermediate", "skills": m.get("intermediate_skills", []),
         "technologies": m.get("technologies", [])[2:5], "certifications": m.get("certifications", [])[:1]},
        {"stage": 3, "title": "Projects & Experience", "projects": m.get("projects", []),
         "skills": m.get("advanced_skills", [])},
        {"stage": 4, "title": "Target & Advanced Roles", "progression": m.get("career_progression", []),
         "certifications": m.get("certifications", [])},
    ]
    out = {
        "target_role": m["career_role"], "current_level": level,
        "current_skills": current, "missing_skills": missing,
        "required_skills": m.get("required_skills", []),
        "technologies": m.get("technologies", []), "tools": m.get("tools", []),
        "certifications": m.get("certifications", []),
        "career_progression": m.get("career_progression", []),
        "related_roles": m.get("related_roles", []),
        "roadmap": roadmap,
        "sources": [{"role": m["career_role"], "doc_id": match["id"]}],
        "grounding_note": "All technologies, certifications and progression steps are taken verbatim from the retrieved knowledge-base document. No external facts were added.",
    }
    return out

def answer_question(question: str, k: int = 3):
    hits = retrieve(question, k=k)
    if not hits:
        return {"answer": "No relevant career documents found. Try asking about a specific role or skill.", "sources": []}
    # grounded extractive answer: stitch KB fields
    ctx = [h["doc"]["metadata"] for h in hits]
    lines = [f"Based on our career knowledge base (retrieved: {', '.join(c['career_role'] for c in ctx)}):"]
    for c in ctx:
        lines.append(f"\n### {c['career_role']}\n{c['description']}\nRequired: {', '.join(c['required_skills'][:6])}\nCertifications: {', '.join(c['certifications'][:2])}\nProgression: {' -> '.join(c['career_progression'][:4])}")
    return {"answer": "\n".join(lines),
            "sources": [{"role": c["career_role"], "score": h["score"]} for c, h in zip(ctx, hits)],
            "grounding_note": "Answer composed only from retrieved KB documents listed in sources."}

def load_kb_roles():
    vs, _ = _load()
    return sorted(d["metadata"]["career_role"] for d in vs.docs)

def get_career_doc(name: str):
    vs, _ = _load()
    for d in vs.docs:
        if d["metadata"]["career_role"].lower() == name.lower():
            return d["metadata"]
    return None

def list_certifications():
    """Deduplicated KB certifications with the roles that list them (grounded checklist)."""
    vs, _ = _load()
    by_cert: dict[str, set] = {}
    for d in vs.docs:
        role = d["metadata"]["career_role"]
        for c in d["metadata"].get("certifications", []):
            by_cert.setdefault(c, set()).add(role)
    return [{"certification": c, "roles": sorted(by_cert[c])} for c in sorted(by_cert)]

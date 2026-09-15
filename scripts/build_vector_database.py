"""Build persisted vector DB from knowledge_base/*.json. Run: python scripts/build_vector_database.py"""
import json, sys
from pathlib import Path
import numpy as np
import joblib

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))
from backend.embeddings import Embedder
from backend.vector_store import VectorStore, ART

def doc_to_text(d: dict) -> str:
    parts = [d.get("career_role",""), d.get("description",""),
             "Responsibilities: " + "; ".join(d.get("responsibilities", [])),
             "Required: " + ", ".join(d.get("required_skills", [])),
             "Preferred: " + ", ".join(d.get("preferred_skills", [])),
             "Languages: " + ", ".join(d.get("programming_languages", [])),
             "Technologies: " + ", ".join(d.get("technologies", [])),
             "Certifications: " + ", ".join(d.get("certifications", [])),
             "Progression: " + " -> ".join(d.get("career_progression", []))]
    return "\n".join(parts)

def main():
    kb_dir = BASE / "knowledge_base"
    files = sorted(kb_dir.glob("*.json"))
    assert files, "No KB docs found!"
    docs, texts = [], []
    for fp in files:
        d = json.loads(fp.read_text(encoding="utf-8"))
        t = doc_to_text(d)
        texts.append(t)
        docs.append({"id": fp.stem, "text": t, "metadata": d})
    ART.mkdir(parents=True, exist_ok=True)
    emb = Embedder()
    import os
    if os.getenv("VECTOR_STORE", "tfidf") == "sbert":
        try:
            vecs = np.asarray(emb.encode(texts), dtype=float)
            emb.mode = "sbert"
        except Exception as e:
            print(f"SBERT failed ({e}), falling back to TF-IDF");
            vecs = emb.fit_tfidf(texts).toarray()
            vecs = vecs / (np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-9)
    else:
        X = emb.fit_tfidf(texts)
        vecs = X.toarray()
        vecs = vecs / (np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-9)
    vs = VectorStore(); vs.docs = docs; vs.vectors = vecs; vs.mode = emb.mode; vs.save()
    print(f"Built vector DB: mode={emb.mode}, n={len(docs)} -> {ART}")

if __name__ == "__main__":
    main()

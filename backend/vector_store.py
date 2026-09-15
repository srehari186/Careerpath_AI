"""Persisted vector store (TF-IDF default; SBERT if built with VECTOR_STORE=sbert)."""
import json
from pathlib import Path
import numpy as np
import joblib

BASE = Path(__file__).resolve().parent.parent
ART = BASE / "models" / "vector_store"

class VectorStore:
    def __init__(self):
        self.docs = []      # list of {id, text, metadata}
        self.vectors = None # np array L2-normalized
        self.mode = "tfidf"

    def save(self):
        ART.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.vectors, ART / "vectors.pkl")
        with open(ART / "docs.json", "w", encoding="utf-8") as f:
            json.dump(self.docs, f, indent=2)
        with open(ART / "meta.json", "w") as f:
            json.dump({"mode": self.mode, "n": len(self.docs)}, f)

    def load(self):
        import os
        if not (ART / "vectors.pkl").exists():
            return False
        self.vectors = joblib.load(ART / "vectors.pkl")
        with open(ART / "docs.json", encoding="utf-8") as f:
            self.docs = json.load(f)
        try:
            with open(ART / "meta.json") as f:
                self.mode = json.load(f).get("mode", "tfidf")
        except Exception:
            pass
        return True

    def search(self, query_vec, k=3):
        if self.vectors is None or not len(self.docs):
            return []
        q = np.asarray(query_vec).ravel()
        q = q / (np.linalg.norm(q) + 1e-9)
        sims = self.vectors @ q
        idx = np.argsort(sims)[::-1][:k]
        return [{"score": float(sims[i]), "doc": self.docs[i]} for i in idx]

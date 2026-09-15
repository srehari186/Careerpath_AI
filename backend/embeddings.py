"""Embedding backend: sentence-transformers if available, else TF-IDF fallback (offline, deploy-friendly)."""
import os
from pathlib import Path
import joblib

BASE = Path(__file__).resolve().parent.parent
ART = BASE / "models" / "vector_store"

def _st_available():
    try:
        import sentence_transformers  # noqa
        return True
    except Exception:
        return False

class Embedder:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.mode = "tfidf"
        self.model = None
        self.vectorizer = None
        if os.getenv("VECTOR_STORE", "tfidf") == "sbert" and _st_available():
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(model_name)
                self.mode = "sbert"
            except Exception:
                self.mode = "tfidf"
        # load fitted tfidf if exists
        tfidf_path = ART / "tfidf.pkl"
        if self.mode == "tfidf" and tfidf_path.exists():
            try:
                self.vectorizer = joblib.load(tfidf_path)
            except Exception:
                self.vectorizer = None

    def fit_tfidf(self, texts):
        from sklearn.feature_extraction.text import TfidfVectorizer
        self.vectorizer = TfidfVectorizer(max_features=2000, ngram_range=(1, 2), stop_words="english")
        X = self.vectorizer.fit_transform(texts)
        joblib.dump(self.vectorizer, ART / "tfidf.pkl")
        self.mode = "tfidf"
        return X

    def encode(self, texts):
        if self.mode == "sbert" and self.model is not None:
            import numpy as np
            v = self.model.encode(texts, normalize_embeddings=True)
            return v
        from sklearn.preprocessing import normalize
        if self.vectorizer is None:
            raise RuntimeError("TF-IDF vectorizer not fitted. Run scripts/build_vector_database.py first.")
        return normalize(self.vectorizer.transform(texts)).toarray()

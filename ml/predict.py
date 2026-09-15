"""Inference helper used by backend. Run: python ml/predict.py"""
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

BASE = Path(__file__).resolve().parent.parent
_PIPE = None; _LE = None

def load():
    global _PIPE, _LE
    if _PIPE is None:
        _PIPE = joblib.load(BASE / "models" / "career_recommender.pkl")
        _LE = joblib.load(BASE / "models" / "label_encoder.pkl")
    return _PIPE, _LE

def predict_topk(features: dict, k: int = 5):
    pipe, le = load()
    X = pd.DataFrame([features])
    proba = pipe.predict_proba(X)[0]
    idx = np.argsort(proba)[::-1][:k]
    return [{"role": str(le.classes_[pipe.classes_[i]]), "score": float(proba[i])} for i in idx]

if __name__ == "__main__":
    print(predict_topk({
        "education_level": "Bachelor's", "python_skill": 8, "java_skill": 3, "cpp_skill": 2,
        "javascript_skill": 3, "sql_skill": 8, "statistics_skill": 8, "machine_learning_skill": 7,
        "cloud_skill": 3, "web_development_skill": 2, "data_analysis_skill": 8, "cybersecurity_skill": 1,
        "communication_skill": 7, "problem_solving_skill": 8, "interest_ai": 9, "interest_data": 8,
        "interest_web": 2, "interest_cloud": 2, "interest_security": 1, "interest_embedded": 1,
        "experience_level": "Fresher", "preferred_domain": "AI"}))

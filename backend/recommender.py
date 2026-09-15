"""ML recommender: loads saved model ONCE (cached), maps API profile -> model features."""
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

BASE = Path(__file__).resolve().parent.parent
_PIPE = None; _LE = None; _META = None

SKILL_MAP = {"Python": "python_skill", "Java": "java_skill", "C++": "cpp_skill",
             "JavaScript": "javascript_skill", "SQL": "sql_skill", "Statistics": "statistics_skill",
             "Machine Learning": "machine_learning_skill", "Cloud": "cloud_skill",
             "Web Development": "web_development_skill", "Data Analysis": "data_analysis_skill",
             "Cybersecurity": "cybersecurity_skill", "Communication": "communication_skill",
             "Problem Solving": "problem_solving_skill"}
INTEREST_MAP = {"AI": "interest_ai", "Data": "interest_data", "Web": "interest_web",
                "Cloud": "interest_cloud", "Security": "interest_security", "Embedded": "interest_embedded"}

def _load():
    global _PIPE, _LE, _META
    if _PIPE is None:
        _PIPE = joblib.load(BASE / "models" / "career_recommender.pkl")
        _LE = joblib.load(BASE / "models" / "label_encoder.pkl")
        _META = joblib.load(BASE / "models" / "feature_meta.pkl")
    return _PIPE, _LE, _META

def profile_to_features(profile: dict) -> dict:
    skills = {s: 8 for s in profile.get("skills", [])}  # checked skill => 8/10; sliders override
    for k, v in (profile.get("skill_levels") or {}).items():
        canon = SKILL_MAP.get(k, k)
        skills[canon] = v
    feats = {}
    for label, col in SKILL_MAP.items():
        feats[col] = int(skills.get(col, skills.get(label, 2)))
    for label, col in INTEREST_MAP.items():
        feats[col] = 8 if label in profile.get("interests", []) else 3
    feats["education_level"] = profile.get("education", "Bachelor's")
    feats["experience_level"] = profile.get("experience", "Fresher")
    feats["preferred_domain"] = profile.get("domain", "General")
    return feats

def recommend(profile: dict, k: int = 5):
    pipe, le, _ = _load()
    feats = profile_to_features(profile)
    X = pd.DataFrame([feats])
    proba = pipe.predict_proba(X)[0]
    idx = np.argsort(proba)[::-1][:k]
    out = [{"role": str(le.classes_[pipe.classes_[i]]), "score": round(float(proba[i]), 4)} for i in idx]
    return out, feats

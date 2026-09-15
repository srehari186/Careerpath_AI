"""Train + compare ML models for career recommendation.
Run: python ml/train.py
Saves: models/career_recommender.pkl, models/label_encoder.pkl, models/feature_meta.pkl
Validation/test metrics are printed to the console.
"""
import json
from pathlib import Path
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import numpy as np

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data" / "career_dataset.csv"
MODELS = BASE / "models"

CAT = ["education_level", "experience_level", "preferred_domain"]
TARGET = "career_role"


def topk_accuracy(y_true, proba, classes, k):
    # proba: n x C, classes aligned
    topk = np.argsort(proba, axis=1)[:, -k:]
    hits = 0
    for i, t in enumerate(y_true):
        if t in classes[topk[i]]:
            hits += 1
    return hits / len(y_true)


def main():
    df = pd.read_csv(DATA)
    X = df.drop(columns=[TARGET])
    y_raw = df[TARGET]
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    num_cols = [c for c in X.columns if c not in CAT]

    pre = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), CAT),
    ])

    X_train, X_tmp, y_train, y_tmp = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(X_tmp, y_tmp, test_size=0.50, random_state=42, stratify=y_tmp)

    candidates = {
        "logistic_regression": LogisticRegression(max_iter=2000),
        "random_forest": RandomForestClassifier(n_estimators=300, min_samples_leaf=2, n_jobs=-1, random_state=42),
        "hist_gradient_boosting": HistGradientBoostingClassifier(random_state=42),
    }
    try:
        from xgboost import XGBClassifier
        candidates["xgboost"] = XGBClassifier(n_estimators=400, max_depth=8, learning_rate=0.06,
                                              subsample=0.9, colsample_bytree=0.9, eval_metric="mlogloss", n_jobs=-1, random_state=42)
        print("XGBoost available — included in comparison.")
    except Exception as e:
        print(f"XGBoost not available ({e}) — using 3 sklearn models.")

    results = {}
    fitted = {}
    for name, clf in candidates.items():
        pipe = Pipeline([("pre", pre), ("clf", clf)])
        pipe.fit(X_train, y_train)
        proba = pipe.predict_proba(X_val)
        pred = pipe.predict(X_val)
        # pipe.classes_ are encoded ints already
        m = {
            "accuracy": float(accuracy_score(y_val, pred)),
            "precision_macro": float(precision_score(y_val, pred, average="macro", zero_division=0)),
            "recall_macro": float(recall_score(y_val, pred, average="macro", zero_division=0)),
            "f1_macro": float(f1_score(y_val, pred, average="macro", zero_division=0)),
            "top1": float(accuracy_score(y_val, pred)),
            "top3": float(topk_accuracy(le.inverse_transform(y_val), proba, le.inverse_transform(pipe.classes_), 3)),
            "top5": float(topk_accuracy(le.inverse_transform(y_val), proba, le.inverse_transform(pipe.classes_), 5)),
        }
        results[name] = m
        fitted[name] = pipe
        print(f"{name}: {json.dumps(m, indent=1)}")

    # select best by val f1, tie-break top3
    best = max(results, key=lambda k: (results[k]["f1_macro"], results[k]["top3"]))
    print(f"BEST: {best}")
    best_pipe = fitted[best]

    # final test metrics
    proba_t = best_pipe.predict_proba(X_test)
    pred_t = best_pipe.predict(X_test)
    test_m = {
        "accuracy": float(accuracy_score(y_test, pred_t)),
        "precision_macro": float(precision_score(y_test, pred_t, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(y_test, pred_t, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(y_test, pred_t, average="macro", zero_division=0)),
        "top1": float(accuracy_score(y_test, pred_t)),
        "top3": float(topk_accuracy(le.inverse_transform(y_test), proba_t, le.inverse_transform(best_pipe.classes_), 3)),
        "top5": float(topk_accuracy(le.inverse_transform(y_test), proba_t, le.inverse_transform(best_pipe.classes_), 5)),
    }
    print(f"TEST ({best}): {json.dumps(test_m, indent=1)}")

    MODELS.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_pipe, MODELS / "career_recommender.pkl")
    joblib.dump(le, MODELS / "label_encoder.pkl")
    joblib.dump({"cat": CAT, "num": num_cols, "model_name": best}, MODELS / "feature_meta.pkl")
    print(f"Saved model ({best}) -> {MODELS/'career_recommender.pkl'}")


if __name__ == "__main__":
    main()

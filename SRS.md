# Software Requirements Specification (SRS)
## CareerPath AI — Career Pathway Knowledge Explorer (EMP-04)

**Version:** 1.0.0
**Date:** 2026-09-15
**Status:** Baseline (maps to working prototype in `career-pathway-explorer/`)
**Standard:** IEEE 830-style SRS

---

## 1. Introduction

### 1.1 Purpose
This SRS specifies the requirements for **CareerPath AI**, an AI-powered career-path exploration system. It is the single source of truth for what the system must do, covering: user profiling, a trained ML career-ranking model, embedding-based retrieval over a defined career knowledge base, grounded RAG pathway generation, a FastAPI backend, a React frontend, and evaluation. Intended readers: developers, hackathon judges, testers, and deployers.

### 1.2 Scope
The system SHALL:
- Accept a user profile (education, skills, interests, experience, preferred domain).
- Rank 20 defined career roles using a **trained classifier** (no hardcoded rules).
- Retrieve supporting facts from a **curated knowledge base (KB)** via embeddings + vector search.
- Generate a **personalized, KB-grounded** career roadmap (current skills, missing skills, staged plan, technologies, certifications, progression).
- Answer career questions via a RAG chatbot that cites sources.
- Expose all capabilities via a REST API and a responsive web UI, with an evaluation dashboard.

The system SHALL NOT invent certifications, technologies, salaries, or progression steps outside the KB.

### 1.3 Definitions & Acronyms
| Term | Meaning |
|---|---|
| ML | Machine Learning (ranking model) |
| RAG | Retrieval-Augmented Generation (retrieve KB docs → generate grounded answer) |
| KB | Career knowledge base (`knowledge_base/*.json`, 20 role documents) |
| Top-K | K highest-scoring roles/documents |
| Skill gap | Required role skills minus user skills |
| MVP | Minimum viable prototype |

### 1.4 References
- Prototype repo: `career-pathway-explorer/` (README, `requirements.txt`, `docker-compose.yml`)
- Dataset: `data/career_dataset.csv` (+ generator `scripts/generate_dataset.py`)
- Model artifacts: `models/career_recommender.pkl`, `models/label_encoder.pkl`, `models/feature_meta.pkl`
- Vector store: `models/vector_store/` (built by `scripts/build_vector_database.py`)
- Evaluation: `evaluation/results/metrics.json`, `confusion_matrix.csv`, `rag_metrics.json`; scripts `ml/evaluate.py`, `evaluation/rag_eval.py`

### 1.5 Overview
§2 describes the product; §3 lists functional requirements (FR); §4 interface requirements; §5 non-functional requirements (NFR); §6 data/ML/RAG-specific requirements; §7 acceptance criteria; Appendix A gives the API contract summary.

---

## 2. Overall Description

### 2.1 Product Perspective
Standalone client–server system:

```
React Frontend → FastAPI Backend → ML Model (rank) → Embedder/Vector DB (retrieve) → RAG pipeline (grounded roadmap/chat)
```

Key context: the ML model predicts; RAG explains. The LLM/template layer MUST NOT replace the classifier and MUST NOT introduce facts absent from retrieved KB docs.

### 2.2 Product Functions (summary)
1. Career assessment form → profile validation.
2. ML-based Top-5 career ranking with match scores + explainable reasons.
3. Personalized pathway: level, current/missing skills, 4-stage roadmap, tech/certs/projects/progression.
4. Career catalog browsing (20 roles) + role detail view.
5. RAG career chatbot with cited sources.
6. Evaluation dashboard (ML metrics, confusion matrix, RAG metrics + methodology).

### 2.3 User Classes
| Class | Description | Access |
|---|---|---|
| Explorer (primary) | Student/job-seeker exploring careers | All user-facing pages + APIs |
| Judge/Evaluator | Hackathon evaluator | Evaluation dashboard, `/evaluation`, metrics files |
| Maintainer/Deployer | Builds, retrains, deploys | Scripts, Dockerfile, `.env` config |

### 2.4 Operating Environment
- Backend: Python 3.11+ (developed 3.13), FastAPI + Uvicorn, scikit-learn/pandas/numpy; runs locally, Docker, or Render/Railway.
- Frontend: Node 20+, React 18 + Vite; runs via `npm run dev` or static `dist/` on Vercel.
- Vector DB: file-persisted TF-IDF store by default (no GPU/services required); optional SBERT mode.
- Browsers: latest Chrome/Edge/Firefox, desktop + mobile viewports.

### 2.5 Constraints
- C-1: No hardcoded role predictions; all scores MUST come from the trained model file.
- C-2: All factual career content in responses MUST be traceable to retrieved KB docs (verbatim tech/certs/progression).
- C-3: Training dataset is synthetic; this MUST be disclosed (README + UI footnote where metrics shown).
- C-4: No API keys hardcoded; configuration via environment variables (`.env`).
- C-5: Offline-first: full pipeline MUST work without external LLM API keys.

### 2.6 Assumptions & Dependencies
- A-1: Users self-report skills honestly on a 0–10 scale (checked skill defaults to 8/10).
- A-2: KB covers exactly the 20 classifier roles; adding a role requires dataset + KB + retrain + vector rebuild.
- A-3: SBERT/FAISS/Chroma are optional enhancements; default TF-IDF meets MVP accuracy (measured R@3 = 1.000).

---

## 3. Functional Requirements

### 3.1 User Profiling
- **FR-1.1** The system SHALL accept a profile with: `education` (5 levels), `experience` (3 levels), `skills` (multi-select of 13 skill labels), `skill_levels` (optional 0–10 overrides), `interests` (multi-select of 6), `domain` (7 options).
- **FR-1.2** The system SHALL validate inputs and reject empty/unknown enum values with HTTP 422.
- **FR-1.3** The system SHALL map profile labels to the 22 model features deterministically (checked skill → 8, unlisted skill → 2, selected interest → 8, else 3).

### 3.2 ML Career Recommendation
- **FR-2.1** The system SHALL load the trained classifier once at startup and reuse it (no per-request reload).
- **FR-2.2** Given a valid profile, the system SHALL return the Top-5 roles with probability scores (0–1, 4 decimals).
- **FR-2.3** Each recommendation SHALL include 1–4 human-readable reasons derived from the user's top numeric skills (≥6/10 overlapping role requirements) and strong interests (≥7/10).
- **FR-2.4** The response SHALL label scores as ML output and reasons/facts as KB-grounded (distinguish prediction vs. explanation).
- **FR-2.5** If the model file is missing, the API SHALL return HTTP 500 with "Run ml/train.py first."

### 3.3 Embedding Retrieval / Vector Store
- **FR-3.1** The system SHALL persist the vector DB (`vectors.pkl`, `docs.json`, `tfidf.pkl`, `meta.json`) and load it without rebuilding per request.
- **FR-3.2** Retrieval SHALL support Top-K semantic search (default K=3, max 5) over KB document text (role + description + skills + tech + certs + progression).
- **FR-3.3** Each retrieval hit SHALL return the source role/doc-id and similarity score.
- **FR-3.4** If the vector DB is missing, dependent endpoints SHALL return HTTP 500 directing to `scripts/build_vector_database.py`.
- **FR-3.5** Empty retrieval results SHALL yield a safe fallback message, never fabricated content.

### 3.4 Personalized Pathway & Skill-Gap Analysis
- **FR-4.1** Given a profile + `target_role`, the system SHALL return: target role, current level (Beginner ≤2 / Intermediate ≤4 / Advanced), `current_skills`, `missing_skills`, `required_skills`, technologies, tools, certifications, `career_progression`, `related_roles`, and a 4-stage roadmap (Foundation → Intermediate → Projects & Experience → Target & Advanced roles).
- **FR-4.2** Skill-gap computation SHALL be set-difference of KB `required_skills` vs. user skills (case-insensitive, substring-tolerant).
- **FR-4.3** Every technology, certification, project, and progression item SHALL appear verbatim in the source KB document (groundedness = 1.000 target).
- **FR-4.4** Unknown `target_role` SHALL return HTTP 404 with pointer to `GET /careers`.
- **FR-4.5** The response SHALL include the ML match score for the target role (labeled as such) plus a grounding note.

### 3.5 RAG Chatbot
- **FR-5.1** Given a question (3–1000 chars) + `top_k`, the system SHALL retrieve Top-K docs and compose an answer ONLY from them.
- **FR-5.2** Every chat answer SHALL include `sources` (role + score) and a grounding note.
- **FR-5.3** Example queries the system SHALL handle: role skill requirements, role matching for given skills, "what to learn first", "why was X recommended" (via pathway context), project suggestions.

### 3.6 Career Catalog
- **FR-6.1** `GET /careers` SHALL list all 20 roles.
- **FR-6.2** `GET /career/{name}` SHALL return the full KB document; unknown names → HTTP 404.

### 3.7 Evaluation & Observability
- **FR-7.1** `GET /evaluation` SHALL return the saved ML metrics JSON (per-model accuracy, precision/recall/F1-macro, Top-1/3/5; best model + test metrics).
- **FR-7.2** The frontend SHALL render a dashboard: per-model metric table, F1 bar chart, and RAG methodology note.
- **FR-7.3** `GET /health` SHALL return service status.

---

## 4. External Interface Requirements

### 4.1 User Interface
- **UI-1** Pages: Home (`/`), Assessment (`/assessment`), Recommendations (`/recommendations`), Pathway (`/pathway`), Career Detail (`/career/:name`), AI Assistant (`/assistant`), Evaluation (`/evaluation`).
- **UI-2** Home SHALL show title "CareerPath AI", subtitle "Discover the career path that matches your skills, interests and goals.", CTA "Explore My Career Path", and ML+RAG+roadmap badges.
- **UI-3** Assessment SHALL provide dropdowns (education/experience/domain), toggle chips (skills/interests), "Analyze My Career" button, loading + error states.
- **UI-4** Recommendations SHALL show match-% cards with reasons and "View Pathway" per role.
- **UI-5** Pathway SHALL visualize current vs. missing skills and the 4-stage roadmap timeline with tech/projects/certs/progression.
- **UI-6** Assistant SHALL show Q&A thread with per-answer source citations.
- **UI-7** UI SHALL be responsive (mobile + desktop) and meet basic accessibility (labels, keyboard-operable controls, contrast).

### 4.2 REST API (base `http://localhost:8000`, docs at `/docs`)
| Endpoint | I/O |
|---|---|
| `POST /predict-career` | profile → `{recommended_careers[{role, score, reason, sources}], model, grounding_note}` |
| `POST /career-pathway` | `{profile, target_role}` → `{ml_score, career_pathway{...}, note}` |
| `POST /chat` | `{question, top_k}` → `{answer, sources, grounding_note}` |
| `GET /careers` | → `{roles[20]}` |
| `GET /career/{name}` | → KB document |
| `GET /evaluation` | → metrics JSON |
| `GET /health` | → `{status: ok}` |
- **API-1** Errors use standard codes: 404 unknown career, 422 validation, 500 missing artifacts with remediation hint.
- **API-2** CORS SHALL permit the configured frontend origin (default open for MVP with `FRONTEND_URL` env).

### 4.3 Software / Hardware / Communications
- **SI-1** Backend deps pinned in `requirements.txt`; frontend deps in `frontend/package.json`.
- **SI-2** Supported: 2 GB RAM minimum; no GPU required (TF-IDF default).
- **SI-3** HTTP/JSON only; no streaming requirement for MVP.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-P1** `/predict-career` p95 latency ≤ 2 s locally (cached model, ≤5-role output).
- **NFR-P2** `/career-pathway` and `/chat` p95 ≤ 3 s (Top-K ≤ 5, persisted vectors).
- **NFR-P3** Cold start (model + vector load) ≤ 15 s on a standard laptop.

### 5.2 Reliability & Robustness
- **NFR-R1** No crashes on unknown careers, missing skills, or empty retrieval — defined 404/fallback responses (FR-4.4, FR-3.5).
- **NFR-R2** Repeated identical queries SHOULD hit the response cache.
- **NFR-R3** Training SHALL be reproducible (fixed seed 42; stratified splits).

### 5.3 Usability
- **NFR-U1** A new user SHALL reach recommendations within 3 clicks from Home.
- **NFR-U2** Every recommendation/pathway/answer SHALL display its basis (ML score vs. KB source).

### 5.4 Security & Privacy
- **NFR-S1** No secrets in code; `.env.example` documents all variables; `.env` never committed.
- **NFR-S2** Input validation on all POST bodies; max question length 1000 chars.
- **NFR-S3** No personal data persisted server-side in MVP (profiles held in browser session only).

### 5.5 Maintainability & Portability
- **NFR-M1** Module boundaries: `ml/` (train/eval/predict), `backend/` (recommender/rag/embeddings/vector_store), `scripts/` (dataset/KB/vector/test), `frontend/src/` (pages/services/components).
- **NFR-M2** Adding a role = update dataset generator + KB + retrain + rebuild vectors (documented in README §15/Future work).
- **NFR-M3** Docker image SHALL rebuild all artifacts deterministically; `docker-compose` SHALL run the stack locally.

---

## 6. Data, ML & RAG Requirements

### 6.1 Data (DA)
- **DA-1** Dataset: 2,000 rows, 20 roles × 100, 22 features + `career_role` target; CSV at `data/career_dataset.csv`.
- **DA-2** Generator (`scripts/generate_dataset.py --n 2000 --seed 42`) uses per-role ideal profiles + N(0,1.6) noise, categorical jitter (15%/15%/12%); MUST be labeled synthetic.
- **DA-3** KB: 20 JSON docs, each with: role, description, responsibilities, prerequisites, required/preferred skills, languages, technologies, tools, certifications, beginner/intermediate/advanced skills, projects, progression, related roles, learning resources.

### 6.2 ML (MLR)
- **MLR-1** Compare ≥3 classifiers (LR, RF, HGB; +XGBoost if installed) on 70/15/15 stratified split with proper preprocessing (scale numerics, one-hot categoricals).
- **MLR-2** Report accuracy, precision/recall/F1-macro, confusion matrix, Top-1/3/5.
- **MLR-3** Select best on validation F1 (tie-break Top-3); persist model + label encoder + feature meta.
- **MLR-4 (acceptance baseline):** best model MUST achieve test accuracy ≥ 0.85, Top-3 ≥ 0.95 (prototype: 0.913 / 1.000).

### 6.3 RAG (RAGR)
- **RAGR-1** Pipeline stages: preprocess → chunk (per-doc text) → embed → vector store → Top-K search → grounded generation → cited response.
- **RAGR-2** Default embeddings TF-IDF (max 2000 features, 1–2 grams); SBERT `all-MiniLM-L6-v2` optional via `VECTOR_STORE=sbert`.
- **RAGR-3 (acceptance baseline):** retrieval R@3 ≥ 0.90, P@1 ≥ 0.85, answer groundedness = 1.00 on role-query suite (prototype: 1.000 / 0.950 / 1.000).
- **RAGR-4** Methodology MUST be documented in `evaluation/rag_eval.py`; metrics MUST be measured, never fabricated.

---

## 7. Acceptance Criteria
1. `python scripts/test_api.py` → ALL API TESTS PASSED (7 endpoints incl. error paths).
2. `npm run build` succeeds; all 7 pages render and the profile→recommendations→pathway flow works against local backend.
3. MLR-4 and RAGR-3 thresholds met with artifacts present (`models/*.pkl`, `models/vector_store/*`, `evaluation/results/*`).
4. Spot-check: 3 sample profiles produce correctly ranked roles; 3 pathway outputs contain only KB-verbatim tech/certs/progression; 3 chat answers cite correct sources.
5. `docker-compose up` serves backend :8000 and frontend :5173.

---

## Appendix A — Requirement Traceability (prototype files)
| Requirement | Implementation | Test |
|---|---|---|
| FR-1 | `backend/schemas.py`, `frontend/src/pages/Assessment.jsx` | `scripts/test_api.py` (predict) |
| FR-2 | `ml/train.py`, `backend/recommender.py` | `ml/evaluate.py`, `/evaluation` |
| FR-3 | `backend/embeddings.py`, `vector_store.py`, `scripts/build_vector_database.py` | `evaluation/rag_eval.py` |
| FR-4/5 | `backend/rag.py` | `test_api.py` (pathway/chat) |
| FR-6/7 | `backend/main.py`, `frontend/src/pages/*` | `test_api.py`, manual UI pass |
| NFR/MLR/RAGR | README §§5–8, 14 | thresholds in §6–7 |

## Appendix B — Out of Scope (MVP)
Salary prediction, user accounts/persistence, course enrollment APIs, multilingual UI, native mobile apps, online model retraining from user feedback (future work — see README §15).

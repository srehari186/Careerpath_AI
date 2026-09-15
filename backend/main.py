"""FastAPI backend for CareerPath AI: ML ranking + grounded RAG pathways + chat."""
import hashlib, json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.schemas import UserProfile, PredictResponse, PathwayRequest, ChatRequest, CareerRec
from backend import recommender, rag

app = FastAPI(title="CareerPath AI", version="1.0.0",
              description="ML career ranking + RAG-grounded pathways. ML predicts; RAG explains from KB only.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

_CACHE: dict = {}
def _hash(obj) -> str:
    return hashlib.md5(json.dumps(obj, sort_keys=True).encode()).hexdigest()

@app.get("/health")
def health():
    return {"status": "ok", "service": "careerpath-ai"}

@app.get("/careers")
def careers():
    try:
        return {"roles": rag.load_kb_roles()}
    except Exception as e:
        raise HTTPException(500, f"KB not loaded: {e}. Run scripts/build_vector_database.py")

@app.get("/career/{career_name}")
def career_detail(career_name: str):
    doc = rag.get_career_doc(career_name)
    if doc is None:
        raise HTTPException(404, f"Unknown career '{career_name}'. See GET /careers.")
    return doc

@app.get("/certifications")
def certifications():
    try:
        return {"certifications": rag.list_certifications()}
    except Exception as e:
        raise HTTPException(500, f"KB not loaded: {e}. Run scripts/build_vector_database.py")

@app.post("/predict-career", response_model=PredictResponse)
def predict_career(profile: UserProfile):
    key = "pred:" + _hash(profile.model_dump())
    if key in _CACHE:
        return _CACHE[key]
    try:
        recs, feats = recommender.recommend(profile.model_dump(), k=5)
    except FileNotFoundError:
        raise HTTPException(500, "ML model not found. Run ml/train.py first.")
    enriched = []
    for r in recs:
        doc = rag.get_career_doc(r["role"])
        reasons = rag.explain_reasons({"numeric": feats}, doc) if doc else ["ML-ranked from profile similarity"]
        enriched.append(CareerRec(role=r["role"], score=r["score"], reason=reasons,
                                  sources=[r["role"]] if doc else []))
    resp = PredictResponse(recommended_careers=enriched)
    _CACHE[key] = resp
    return resp

@app.post("/career-pathway")
def career_pathway(req: PathwayRequest):
    doc = rag.get_career_doc(req.target_role)
    if doc is None:
        raise HTTPException(404, f"Unknown career '{req.target_role}'. See GET /careers.")
    try:
        pathway = rag.build_pathway(req.target_role, req.profile.skills or [], {"numeric": recommender.profile_to_features(req.profile.model_dump())})
    except Exception as e:
        raise HTTPException(500, f"Pathway generation failed: {e}")
    # attach ML score for context (clearly labeled)
    try:
        recs, _ = recommender.recommend(req.profile.model_dump(), k=20)
        ml_score = next((r["score"] for r in recs if r["role"].lower() == req.target_role.lower()), None)
    except Exception:
        ml_score = None
    return {"ml_score": ml_score, "career_pathway": pathway,
            "note": "ml_score is the ML model's match probability; all skills/certs/steps are KB-grounded."}

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        return rag.answer_question(req.question, k=req.top_k)
    except RuntimeError as e:
        raise HTTPException(500, str(e))

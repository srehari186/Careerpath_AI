import sys, json
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from backend.main import app
c = TestClient(app)
print("health:", c.get("/health").json())
print("roles5:", c.get("/careers").json()["roles"][:5])
r = c.post("/predict-career", json={"education": "Bachelor's", "experience": "Fresher",
      "skills": ["Python", "SQL"], "interests": ["AI", "Data"], "domain": "AI"})
print("predict:", r.status_code)
print(json.dumps(r.json()["recommended_careers"][:3], indent=1))
p = c.post("/career-pathway", json={"profile": {"education": "Bachelor's", "experience": "Fresher",
      "skills": ["Python", "SQL"], "interests": ["AI"], "domain": "AI"}, "target_role": "Data Scientist"})
print("pathway:", p.status_code)
print(json.dumps(p.json()["career_pathway"], indent=1)[:900])
q = c.post("/chat", json={"question": "What skills do I need for ML Engineer?"})
print("chat:", q.status_code, q.json().get("sources"))
print("ALL API TESTS PASSED")

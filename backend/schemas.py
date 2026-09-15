"""Pydantic schemas for CareerPath AI API."""
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class UserProfile(BaseModel):
    education: str = Field(default="Bachelor's", description="Education level")
    experience: str = Field(default="Fresher")
    skills: List[str] = Field(default_factory=list)
    skill_levels: Optional[Dict[str, int]] = Field(default_factory=dict)
    interests: List[str] = Field(default_factory=list)
    domain: str = Field(default="General")

class CareerRec(BaseModel):
    role: str
    score: float
    reason: List[str] = []
    sources: List[str] = []

class PredictResponse(BaseModel):
    recommended_careers: List[CareerRec]
    model: str = "ml-recommender"
    grounding_note: str = "Scores from trained ML model; reasons + facts grounded in KB retrieval."

class PathwayRequest(BaseModel):
    profile: UserProfile
    target_role: str

class ChatRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    top_k: int = Field(default=3, ge=1, le=5)

"""Vercel serverless entrypoint — exposes the existing FastAPI app (see vercel.json).
No code is duplicated: the same `backend.main:app` serves local, Docker, and Vercel.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.main import app  # noqa: E402  (Vercel looks for `app`)

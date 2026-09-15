"""ORM-style models placeholder (stateless API; kept for spec compliance + future DB)."""
from dataclasses import dataclass, field

@dataclass
class CareerDocument:
    role: str
    description: str = ""
    required_skills: list = field(default_factory=list)

@dataclass
class UserQueryLog:
    profile_hash: str
    top_roles: list = field(default_factory=list)

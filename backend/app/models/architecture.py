from pydantic import BaseModel
from typing import List, Dict, Any

class ArchitectureRequest(BaseModel):
    prompt: str
    platform: str = "AWS"

class ArchitectureResponse(BaseModel):
    id: str
    title: str
    platform: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    created_at: str

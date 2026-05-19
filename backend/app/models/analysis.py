from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class Issue(BaseModel):
    severity: str
    title: str
    description: str
    suggestion: Optional[str] = None

class AnalysisResponse(BaseModel):
    id: str
    issues: List[Issue]
    suggested_nodes: List[Dict[str, Any]]
    suggested_edges: List[Dict[str, Any]]
    created_at: str

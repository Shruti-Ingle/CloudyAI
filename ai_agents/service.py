from fastapi import FastAPI, APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ai_agents.orchestrator.graph import run_agent_pipeline
from rag_pipeline.retrieval.rag_chain import answer_question

app = FastAPI(title="CloudDaddy AI/ML Core Service")
router = APIRouter()

class RunAgentRequest(BaseModel):
    task_type: str
    input_data: Dict[str, Any]

class RagQueryRequest(BaseModel):
    query: str
    conversation_history: Optional[List[Dict[str, Any]]] = None
    category: Optional[str] = None

@router.post("/run")
async def api_run_agents(req: RunAgentRequest):
    try:
        result = await run_agent_pipeline(req.task_type, req.input_data)
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def api_rag_query(req: RagQueryRequest):
    try:
        answer = await answer_question(req.query, req.conversation_history, req.category)
        return {"status": "success", "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(router, prefix="/agents")

async def run_pipeline(task_type: str, input_data: dict) -> dict:
    return await run_agent_pipeline(task_type, input_data)

async def query_rag(query: str, history: list = None, category: str = None) -> str:
    return await answer_question(query, history, category)

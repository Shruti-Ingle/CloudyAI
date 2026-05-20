import pytest
from unittest.mock import MagicMock, patch
from ai_agents.orchestrator.graph import run_agent_pipeline
from ai_agents.architecture_agent.agent import ArchitectureAgent
from ai_agents.security_agent.agent import SecurityAgent
from ai_agents.cost_agent.agent import CostAgent

@pytest.fixture
def mock_client():
    mock = MagicMock()
    mock.invoke_model.return_value = '{"test": "data"}'
    return mock

def test_architecture_agent_run(mock_client):
    agent = ArchitectureAgent(client=mock_client)
    mock_client.invoke_model.return_value = '{"explanation": "ok", "diagram_json": {}, "tradeoffs": "none", "cost_estimate_rough": "$10"}'
    
    state = {"user_query": "hello"}
    result = agent.run(state)
    
    assert "architecture_output" in result
    assert result["architecture_output"]["explanation"] == "ok"

def test_security_agent_run(mock_client):
    agent = SecurityAgent(client=mock_client)
    mock_client.invoke_model.return_value = '{"findings": [{"severity": "low"}], "overall_risk_score": 10}'
    
    state = {"parsed_config": {}}
    result = agent.run(state)
    
    assert "security_findings" in result
    assert result["overall_risk_score"] == 10

def test_cost_agent_run(mock_client):
    agent = CostAgent(client=mock_client)
    mock_client.invoke_model.return_value = '{"current_estimated_cost": 100, "optimized_estimated_cost": 80, "savings_potential": 20, "recommendations": []}'
    
    state = {"architecture_output": {}}
    result = agent.run(state)
    
    assert "cost_analysis" in result
    assert result["cost_analysis"]["savings_potential"] == 20

@pytest.mark.asyncio
@patch("ai_agents.bedrock_client.BedrockOllamaClient.invoke_model")
async def test_full_agent_pipeline(mock_invoke):
    mock_invoke.return_value = '{"explanation": "ok", "diagram_json": {}, "tradeoffs": "none", "cost_estimate_rough": "$10", "findings": [], "overall_risk_score": 0, "current_estimated_cost": 0, "optimized_estimated_cost": 0, "savings_potential": 0, "recommendations": [], "report_markdown": "summary"}'
    
    input_data = {"user_query": "design a website"}
    result = await run_agent_pipeline("design", input_data)
    
    assert result["task_type"] == "design"
    assert "final_report" in result

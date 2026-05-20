from typing import TypedDict, List
from langgraph.graph import StateGraph, END

from ai_agents.architecture_agent.agent import ArchitectureAgent
from ai_agents.security_agent.agent import SecurityAgent
from ai_agents.cost_agent.agent import CostAgent
from ai_agents.monitoring_agent.agent import MonitoringAgent
from ai_agents.incident_agent.agent import IncidentAgent
from ai_agents.automation_agent.agent import AutomationAgent
from ai_agents.documentation_agent.agent import DocumentationAgent

class AgentState(TypedDict):
    task_type: str
    user_query: str
    requirements: dict
    parsed_config: dict
    architecture_output: dict
    security_findings: list
    cost_analysis: dict
    capacity_forecast: dict
    incident_summary: dict
    automation_actions: list
    final_report: str
    messages: list
    logs: list
    metrics: dict
    incident_description: str
    cloudwatch_data: dict

def run_architecture(state: AgentState) -> dict:
    agent = ArchitectureAgent()
    return agent.run(state)

def run_security(state: AgentState) -> dict:
    agent = SecurityAgent()
    return agent.run(state)

def run_cost(state: AgentState) -> dict:
    agent = CostAgent()
    return agent.run(state)

def run_monitoring(state: AgentState) -> dict:
    agent = MonitoringAgent()
    return agent.run(state)

def run_incident(state: AgentState) -> dict:
    agent = IncidentAgent()
    return agent.run(state)

def run_automation(state: AgentState) -> dict:
    agent = AutomationAgent()
    return agent.run(state)

def run_documentation(state: AgentState) -> dict:
    agent = DocumentationAgent()
    return agent.run(state)

def route_start(state: AgentState) -> str:
    t = state.get("task_type")
    if t == "full_analysis":
        return "architecture"
    elif t == "incident":
        return "monitoring"
    elif t == "design":
        return "architecture"
    elif t == "security_scan":
        return "security"
    return END

def route_after_architecture(state: AgentState) -> str:
    t = state.get("task_type")
    if t == "full_analysis":
        return "security"
    return "cost"

def route_after_security(state: AgentState) -> str:
    t = state.get("task_type")
    if t == "full_analysis":
        return "cost"
    return "documentation"

workflow = StateGraph(AgentState)

workflow.add_node("architecture", run_architecture)
workflow.add_node("security", run_security)
workflow.add_node("cost", run_cost)
workflow.add_node("monitoring", run_monitoring)
workflow.add_node("incident", run_incident)
workflow.add_node("automation", run_automation)
workflow.add_node("documentation", run_documentation)

workflow.set_conditional_entry_point(
    route_start,
    {
        "architecture": "architecture",
        "monitoring": "monitoring",
        "security": "security",
        END: END
    }
)

workflow.add_conditional_edges(
    "architecture",
    route_after_architecture,
    {
        "security": "security",
        "cost": "cost"
    }
)

workflow.add_conditional_edges(
    "security",
    route_after_security,
    {
        "cost": "cost",
        "documentation": "documentation"
    }
)

workflow.add_edge("cost", "documentation")
workflow.add_edge("monitoring", "incident")
workflow.add_edge("incident", "automation")
workflow.add_edge("automation", "documentation")
workflow.add_edge("documentation", END)

app_graph = workflow.compile()

async def run_agent_pipeline(task_type: str, input_data: dict) -> dict:
    initial_state = {
        "task_type": task_type,
        "user_query": input_data.get("user_query", ""),
        "requirements": input_data.get("requirements", {}),
        "parsed_config": input_data.get("parsed_config", {}),
        "logs": input_data.get("logs", []),
        "metrics": input_data.get("metrics", {}),
        "incident_description": input_data.get("incident_description", ""),
        "cloudwatch_data": input_data.get("cloudwatch_data", {}),
        "architecture_output": {},
        "security_findings": [],
        "cost_analysis": {},
        "capacity_forecast": {},
        "incident_summary": {},
        "automation_actions": [],
        "final_report": "",
        "messages": []
    }
    
    result = await app_graph.ainvoke(initial_state)
    return dict(result)

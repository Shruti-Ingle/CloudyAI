import json
from rag_pipeline.retrieval.retriever import RAGRetriever
from ai_agents.bedrock_client import BedrockOllamaClient

class RAGQAChain:
    def __init__(self, retriever: RAGRetriever = None, client: BedrockOllamaClient = None):
        self.retriever = retriever or RAGRetriever()
        self.client = client or BedrockOllamaClient()

    async def answer_question(self, query: str, conversation_history: list = None, category_filter: str = None) -> str:
        docs = self.retriever.similarity_search(query, k=5, category_filter=category_filter)
        context = "\n\n".join([d.page_content for d in docs])
        
        history_str = ""
        if conversation_history:
            for msg in conversation_history:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_str += f"{role}: {msg.get('content')}\n"
                
        prompt = (
            "You are CloudDaddy Copilot, an enterprise-grade AI Cloud Architecture Intelligence advisor.\n"
            "Answer the query based on the retrieved context guidelines and conversation history.\n\n"
            f"Context:\n{context}\n\n"
            f"History:\n{history_str}\n"
            f"Query: {query}\n\n"
            "Response:"
        )
        
        response = self.client.invoke_model("anthropic.claude-3-sonnet", prompt)
        return response

async def answer_question(query: str, conversation_history: list = None, category_filter: str = None) -> str:
    chain = RAGQAChain()
    return await chain.answer_question(query, conversation_history, category_filter)

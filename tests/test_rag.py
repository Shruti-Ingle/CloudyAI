import os
import pytest
from unittest.mock import MagicMock, patch
from rag_pipeline.ingestion.ingest import RAGIngestion
from rag_pipeline.embeddings.embed_and_index import RAGEmbedderIndexer
from rag_pipeline.retrieval.retriever import RAGRetriever
from rag_pipeline.retrieval.rag_chain import RAGQAChain

def test_ingestion_loads_mock_documents():
    ingestion = RAGIngestion()
    docs = ingestion.run_ingestion()
    
    assert len(docs) > 0
    assert any(doc.metadata["category"] == "security" for doc in docs)

def test_embedder_fallback_indexing():
    embedder = RAGEmbedderIndexer()
    ingestion = RAGIngestion()
    docs = ingestion.get_mock_documents()
    
    embedder.index_documents(docs)
    assert os.path.exists(embedder.fallback_file)

def test_retriever_similarity_search():
    retriever = RAGRetriever()
    results = retriever.similarity_search("security recommendations", k=2)
    
    assert len(results) <= 2

@pytest.mark.asyncio
@patch("ai_agents.bedrock_client.BedrockOllamaClient.invoke_model")
async def test_rag_chain_answer(mock_invoke):
    mock_invoke.return_value = "This is a custom architectural response."
    
    chain = RAGQAChain()
    answer = await chain.answer_question("How do I secure S3 buckets?")
    
    assert "architectural response" in answer

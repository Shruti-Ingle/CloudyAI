# CloudDaddy RAG Ingestion & Retrieval Pipeline

This module manages the document ingestion, embedding generation, vector indexing, and question-answering workflows.

## Pipeline Components

1. **Ingestion (`ingestion/ingest.py`)**: Loads files (PDF, Markdown, Web documentation), runs RecursiveCharacterTextSplitter (chunk size 1000, overlap 200), and injects metadata tags.
2. **Embedding and Indexing (`embeddings/embed_and_index.py`)**: Generates vector representations using AWS Bedrock (`amazon.titan-embed-text-v1`) or Ollama (`nomic-embed-text`) embeddings, indexing them into OpenSearch.
3. **Retrieval (`retrieval/retriever.py`)**: Executes k-NN similarity queries against OpenSearch with metadata filtering.
4. **QA Chain (`retrieval/rag_chain.py`)**: Feeds retrieved contexts and conversation histories into the LLM context to build complete answers.

## Local Fallback

If OpenSearch is offline, the indexing script writes embeddings and document metrics to `rag_pipeline/fallback_db.json`. The retriever will automatically switch to a local NumPy-based cosine-similarity search over this file.

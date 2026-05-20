import os
import json
import numpy as np
from typing import List, Dict, Any
from langchain_core.documents import Document
from rag_pipeline.embeddings.embed_and_index import RAGEmbedderIndexer

class RAGRetriever:
    def __init__(self, embedder: RAGEmbedderIndexer = None):
        self.embedder = embedder or RAGEmbedderIndexer()
        self.index_name = "clouddaddy-knowledge"

    def similarity_search(self, query: str, k: int = 5, category_filter: str = None) -> List[Document]:
        query_vector = self.embedder.get_embedding(query)
        
        if self.embedder.client and self.embedder.client.ping():
            try:
                body = {
                    "size": k,
                    "query": {
                        "bool": {
                            "must": [
                                {
                                    "knn": {
                                        "vector_field": {
                                            "vector": query_vector,
                                            "k": k
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
                
                if category_filter:
                    body["query"]["bool"]["filter"] = [
                        {"term": {"metadata.category.keyword": category_filter}}
                    ]
                    
                response = self.embedder.client.search(index=self.index_name, body=body)
                hits = response.get("hits", {}).get("hits", [])
                
                docs = []
                for hit in hits:
                    source = hit.get("_source", {})
                    docs.append(Document(
                        page_content=source.get("text", ""),
                        metadata=source.get("metadata", {})
                    ))
                return docs
            except Exception:
                pass

        return self._search_fallback(query_vector, k, category_filter)

    def _search_fallback(self, query_vector: List[float], k: int, category_filter: str) -> List[Document]:
        if not os.path.exists(self.embedder.fallback_file):
            return []
        
        try:
            with open(self.embedder.fallback_file, "r", encoding="utf-8") as f:
                records = json.load(f)
        except Exception:
            return []

        scored_docs = []
        q_vec = np.array(query_vector)
        q_norm = np.linalg.norm(q_vec)
        
        for rec in records:
            meta = rec.get("metadata", {})
            if category_filter and meta.get("category") != category_filter:
                continue
                
            text = rec.get("text", "")
            r_vec = np.array(rec.get("vector", []))
            
            if len(r_vec) != len(q_vec):
                score = 0.0
            else:
                r_norm = np.linalg.norm(r_vec)
                if q_norm == 0.0 or r_norm == 0.0:
                    score = 0.0
                else:
                    score = np.dot(q_vec, r_vec) / (q_norm * r_norm)
                    
            scored_docs.append((score, Document(page_content=text, metadata=meta)))
            
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored_docs[:k]]

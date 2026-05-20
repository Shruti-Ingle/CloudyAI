import os
import json
import numpy as np
from typing import List
from opensearchpy import OpenSearch, helpers
from langchain_core.documents import Document
from langchain_aws import BedrockEmbeddings
from langchain_community.embeddings import OllamaEmbeddings

class RAGEmbedderIndexer:
    def __init__(self):
        self.index_name = "clouddaddy-knowledge"
        self.opensearch_host = os.environ.get("OPENSEARCH_HOST", "localhost")
        self.opensearch_port = int(os.environ.get("OPENSEARCH_PORT", "9200"))
        self.opensearch_user = os.environ.get("OPENSEARCH_USER", "admin")
        self.opensearch_pass = os.environ.get("OPENSEARCH_PASSWORD", "admin")
        
        self.fallback_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "fallback_db.json"
        )
        
        try:
            self.embeddings = BedrockEmbeddings(
                model_id="amazon.titan-embed-text-v1",
                region_name=os.environ.get("AWS_REGION", "us-east-1")
            )
            self.dims = 1536
        except Exception:
            try:
                self.embeddings = OllamaEmbeddings(
                    model="nomic-embed-text",
                    base_url=os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
                )
                self.dims = 768
            except Exception:
                self.embeddings = None
                self.dims = 1536

        try:
            self.client = OpenSearch(
                hosts=[{"host": self.opensearch_host, "port": self.opensearch_port}],
                http_auth=(self.opensearch_user, self.opensearch_pass),
                use_ssl=False,
                verify_certs=False,
                ssl_assert_hostname=False,
                ssl_show_warn=False
            )
        except Exception:
            self.client = None

    def get_embedding(self, text: str) -> List[float]:
        if not self.embeddings:
            return [0.0] * self.dims
        try:
            return self.embeddings.embed_query(text)
        except Exception:
            return [0.0] * self.dims

    def create_index_if_not_exists(self):
        if not self.client or not self.client.ping():
            return
        
        if not self.client.indices.exists(index=self.index_name):
            settings = {
                "settings": {
                    "index.knn": True
                },
                "mappings": {
                    "properties": {
                        "vector_field": {
                            "type": "knn_vector",
                            "dimension": self.dims,
                            "method": {
                                "name": "hnsw",
                                "space_type": "l2",
                                "engine": "nmslib"
                            }
                        },
                        "text": {"type": "text"},
                        "metadata": {"type": "object"}
                    }
                }
            }
            self.client.indices.create(index=self.index_name, body=settings)

    def index_documents(self, documents: List[Document]):
        if not self.client or not self.client.ping():
            self._save_fallback(documents)
            return
        
        self.create_index_if_not_exists()
        actions = []
        for doc in documents:
            vector = self.get_embedding(doc.page_content)
            action = {
                "_index": self.index_name,
                "_source": {
                    "vector_field": vector,
                    "text": doc.page_content,
                    "metadata": doc.metadata
                }
            }
            actions.append(action)
            
        try:
            helpers.bulk(self.client, actions)
        except Exception:
            self._save_fallback(documents)

    def _save_fallback(self, documents: List[Document]):
        records = []
        for doc in documents:
            vector = self.get_embedding(doc.page_content)
            records.append({
                "text": doc.page_content,
                "metadata": doc.metadata,
                "vector": vector
            })
        with open(self.fallback_file, "w", encoding="utf-8") as f:
            json.dump(records, f)

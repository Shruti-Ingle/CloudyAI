import os
import json
import time
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader, PyPDFLoader, WebBaseLoader
from langchain_core.documents import Document

class RAGIngestion:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

    def load_and_chunk_file(self, file_path: str, category: str) -> List[Document]:
        if not os.path.exists(file_path):
            return []
        
        ext = os.path.splitext(file_path)[1].lower()
        try:
            if ext == ".pdf":
                loader = PyPDFLoader(file_path)
            elif ext == ".txt" or ext == ".md":
                loader = TextLoader(file_path, encoding="utf-8")
            else:
                return []
            
            docs = loader.load()
            chunks = self.splitter.split_documents(docs)
            for chunk in chunks:
                chunk.metadata.update({
                    "source": os.path.basename(file_path),
                    "category": category,
                    "timestamp": time.time()
                })
            return chunks
        except Exception:
            return []

    def load_from_web(self, url: str, category: str) -> List[Document]:
        try:
            loader = WebBaseLoader(url)
            docs = loader.load()
            chunks = self.splitter.split_documents(docs)
            for chunk in chunks:
                chunk.metadata.update({
                    "source": url,
                    "category": category,
                    "timestamp": time.time()
                })
            return chunks
        except Exception:
            return []

    def get_mock_documents(self) -> List[Document]:
        mocks = [
            {
                "text": "AWS Well-Architected Framework: Security pillar suggests using AWS Secrets Manager to store database connection details instead of hardcoding credentials in ECS task definitions.",
                "category": "security",
                "source": "aws_well_architected_security.md"
            },
            {
                "text": "To optimize costs on AWS compute, purchase EC2 Instance Savings Plans or Compute Savings Plans for continuous steady-state workloads. Spot Instances can yield up to 90% savings for batch jobs and stateless apps.",
                "category": "cost",
                "source": "aws_well_architected_cost.md"
            },
            {
                "text": "A standard highly available web application on AWS requires deploying resources across at least two Availability Zones (Multi-AZ) behind an Application Load Balancer (ALB).",
                "category": "architecture",
                "source": "aws_well_architected_reliability.md"
            },
            {
                "text": "AWS VPC best practices include placing databases and backend instances in private subnets, allowing public access only through NAT Gateways or Application Load Balancers situated in public subnets.",
                "category": "networking",
                "source": "aws_networking_best_practices.md"
            }
        ]
        
        docs = []
        for m in mocks:
            doc = Document(
                page_content=m["text"],
                metadata={
                    "source": m["source"],
                    "category": m["category"],
                    "timestamp": time.time()
                }
            )
            docs.append(doc)
        return docs

    def run_ingestion(self, docs_dir: str = None) -> List[Document]:
        all_chunks = []
        if docs_dir and os.path.exists(docs_dir):
            for root, _, files in os.walk(docs_dir):
                for f in files:
                    fp = os.path.join(root, f)
                    category = "architecture"
                    f_lower = f.lower()
                    if "security" in f_lower:
                        category = "security"
                    elif "cost" in f_lower:
                        category = "cost"
                    elif "network" in f_lower:
                        category = "networking"
                    all_chunks.extend(self.load_and_chunk_file(fp, category))
        
        if not all_chunks:
            all_chunks = self.get_mock_documents()
            
        return all_chunks

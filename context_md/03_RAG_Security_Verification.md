# RAG Security Verification Layer (Optional)

## Overview
Before processing a trace through the anomaly models, this optional layer verifies if the dataset/trace contains known malicious payloads, prompt injections, or sensitive data patterns. It uses embeddings to compare the current trace's text parameters (e.g., tool inputs) against a Vector Database of known threats.

## Implementation Details

```python
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss # For vector similarity search

class RAGSecurityVerifier:
    def __init__(self, threat_database_texts):
        # Load embedding model
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Build Vector DB of known threats (Prompt Injections, Malware Signatures)
        print("Building Threat Vector DB...")
        self.threat_embeddings = self.embedder.encode(threat_database_texts)
        
        self.dimension = self.threat_embeddings.shape[1]
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(np.array(self.threat_embeddings).astype('float32'))
        
        self.similarity_threshold = 0.85 # Alert if similarity is higher than this

    def verify_trace_safety(self, execution_trace):
        """
        Extracts text from tool parameters and checks against known threats.
        """
        texts_to_check = []
        for step in execution_trace['execution_sequence']:
            if step['action'] == 'tool_call':
                # Convert params to string for embedding
                params_str = str(step.get('tool_params', ''))
                texts_to_check.append(params_str)
                
        if not texts_to_check:
            return {"is_safe": True, "highest_threat_score": 0.0}
            
        # Embed current trace text
        query_embeddings = self.embedder.encode(texts_to_check)
        
        # Search Vector DB
        distances, indices = self.index.search(np.array(query_embeddings).astype('float32'), k=1)
        
        # Convert FAISS L2 distance to similarity score (simplified)
        highest_similarity = 1 / (1 + np.min(distances))
        
        is_safe = highest_similarity < self.similarity_threshold
        
        return {
            "is_safe": bool(is_safe),
            "highest_threat_score": float(highest_similarity),
            "flagged_content": texts_to_check[np.argmin(distances)] if not is_safe else None
        }
```

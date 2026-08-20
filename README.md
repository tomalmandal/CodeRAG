# CodeRAG — Engineering Knowledge Retrieval System

A minimal AI-engineering RAG system for source code and engineering docs. It demonstrates AST-aware chunking, Elasticsearch BM25 + vector retrieval, Reciprocal Rank Fusion, cross-encoder reranking, citation-grounded generation, RAGAS/DeepEval-compatible golden evaluation, CI regression checks, and observability hooks.

## Architecture

```
Repo/Docs -> AST-aware ingestion -> Elasticsearch
                              |
                    +---------+---------+
                    |                   |
                   BM25              Dense KNN
                    |                   |
                    +---------+---------+
                              v
                         RRF Fusion
                              v
                      Cross-Encoder
                         Reranking
                              v
                    Citation-grounded LLM
                              v
                         Answer + Sources
```

The project intentionally has no frontend. The CLI is the demo surface because the retrieval/evaluation pipeline is the interview focus.

## Local run

1. Copy `.env.example` to `.env` and add an OpenAI key.
2. Start Elasticsearch: `docker compose up -d elasticsearch`.
3. `npm install`
4. `npm run ingest`
5. `npm run ask -- "Where is JWT authentication implemented?"`
6. `npm run evaluate`

The evaluator uses deterministic golden retrieval checks and is structured so RAGAS/DeepEval can be added without changing the retrieval API. The repo includes `eval/golden.json`.

## Important design decisions

- Elasticsearch is used for both BM25 and dense vector retrieval because it is already on the candidate's resume and keeps infrastructure small.
- RRF is implemented in application code so the fusion logic is explicit and easy to explain.
- Reranking is an interface with a local cross-encoder adapter. If the Python reranker is unavailable, the project falls back to a transparent lexical scorer for offline smoke tests; production/interview demos should use the cross-encoder adapter.
- Generation receives only retrieved evidence and must cite file/line ranges.
- No API keys are committed and the project is intended to run locally.

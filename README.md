# CodeRAG

A retrieval-augmented generation system for understanding and querying codebases using hybrid search, semantic retrieval, reranking, citation-grounded generation, and automated retrieval evaluation.

CodeRAG allows a developer to ingest a source repository and ask natural-language questions such as:

> Where is authentication implemented?

> How are access tokens verified?

> Where is order retry logic handled?

The system retrieves relevant source code using a combination of keyword and vector search, reranks the retrieved context, and provides an answer grounded in the original code with file and line-level citations.

---

## Features

- Repository and source code ingestion
- Code-aware chunking with source metadata
- Vector embeddings for semantic retrieval
- BM25 keyword search
- Elasticsearch dense vector search
- Hybrid retrieval using Reciprocal Rank Fusion (RRF)
- Reranking of retrieved candidates
- Citation-grounded answer generation
- File and line-level source references
- Golden dataset for retrieval evaluation
- Automated `retrieval@5` measurement
- Docker Compose support for Elasticsearch
- GitHub Actions workflow for automated evaluation

---

# Architecture

CodeRAG consists of three primary stages:

1. **Ingestion** — transforms a repository into searchable chunks and vector embeddings.
2. **Retrieval and Generation** — performs hybrid search, reranking, and grounded answer generation.
3. **Evaluation** — validates retrieval quality against a golden dataset.

---

# 1. Ingestion Pipeline

During ingestion, CodeRAG reads the source repository, splits files into smaller chunks, generates embeddings, and stores both the original content and retrieval metadata in Elasticsearch.

```text
                    CODE REPOSITORY
                           │
                           ▼
                      File Loader
                           │
                           ▼
                        Chunking
                           │
                           ▼
                     Code Chunks
                           │
                           ▼
                    Embedding Model
                           │
                           ▼
                  ┌─────────────────┐
                  │  Elasticsearch  │
                  │                 │
                  │ • Chunk text    │
                  │ • Embedding     │
                  │ • File path     │
                  │ • Line numbers  │
                  └─────────────────┘
```

### What is stored?

Each indexed code chunk contains information similar to:

```ts
{
  text: "...source code chunk...",
  embedding: [...],
  path: "src/auth/auth.service.ts",
  startLine: 10,
  endLine: 24
}
```

The `embedding` is used for semantic retrieval, while the original code and source metadata are used to provide context and citations to the final answer.

---

# 2. Query and Retrieval Pipeline

When a user asks a question, CodeRAG uses two complementary retrieval strategies.

```text
                       USER QUESTION
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼

            BM25 Search              Embedding Model
            Exact Keywords                  │
                 │                          ▼
                 │                    Vector Search
                 │                    Semantic Meaning
                 │                          │
                 └────────────┬─────────────┘
                              ▼
                         RRF Fusion
                              │
                              ▼
                       Top Candidates
                              │
                              ▼
                          Reranker
                              │
                              ▼
                      Best Code Chunks
                              │
                              ▼
              Question + Retrieved Context
                              │
                              ▼
                             LLM
                              │
                              ▼
                 Grounded Answer + Citations
```

---

## Hybrid Retrieval

Codebases contain both natural language concepts and exact identifiers.

For example:

```text
"Where is verifyAccessToken implemented?"
```

Keyword search is particularly effective when searching for exact identifiers such as:

- Function names
- Class names
- API names
- Configuration keys

However, developers may ask the same question using completely different language:

```text
"How does the application validate a user's JWT?"
```

This may not contain the exact function name:

```text
verifyAccessToken()
```

Vector search helps retrieve code based on semantic similarity.

CodeRAG therefore combines:

```text
BM25
+
Semantic Vector Search
=
Hybrid Retrieval
```

---

# Reciprocal Rank Fusion

BM25 and vector search produce independent ranked result sets.

Their raw scores cannot be directly compared because each retrieval method uses a different scoring mechanism.

CodeRAG combines the rankings using **Reciprocal Rank Fusion (RRF)**.

```text
BM25 Results                Vector Results

1. auth.service.ts          1. token.service.ts
2. token.service.ts         2. auth.service.ts
3. order.service.ts         3. payment.service.ts
            │                         │
            └────────────┬────────────┘
                         ▼
                     RRF Fusion
                         │
                         ▼
                 Combined Ranking
```

RRF gives higher importance to documents that consistently rank highly across multiple retrieval strategies.

---

# Reranking

Initial retrieval prioritizes recall and returns a broader set of potentially relevant code chunks.

A reranking stage then evaluates the relationship between the user query and each retrieved candidate more precisely.

```text
Repository Index
       │
       ▼
Hybrid Retrieval
       │
       ▼
Top Candidate Chunks
       │
       ▼
    Reranker
       │
       ▼
Highest-Relevance Context
```

This creates a two-stage retrieval architecture:

```text
Stage 1: Retrieve broadly
        ↓
Stage 2: Rerank for precision
```

The highest-ranked chunks are passed to the language model.

---

# Citation-Grounded Generation

The language model does not answer based only on its general knowledge.

CodeRAG provides the retrieved source code as context together with source metadata.

Conceptually:

```text
User Question

        +
        
Retrieved Code Context
        │
        ▼
      LLM
        │
        ▼
Answer based on retrieved evidence
        │
        ▼
File + Line Citations
```

Example output:

```text
Access tokens are verified by the AuthService through the
verifyAccessToken method [1].

Sources:

[1] src/auth/auth.service.ts
    Lines 2-5
```

This approach grounds the response in the indexed repository and allows the user to verify the source of the generated answer.

---

# 3. Evaluation Pipeline

RAG systems can continue running even when retrieval quality degrades.

For example, changing chunking, embeddings, search configuration, or reranking logic may reduce retrieval quality without producing an application error.

CodeRAG includes a golden dataset to automatically evaluate retrieval performance.

```text
Golden Dataset
     │
     ▼
Known Questions
     │
     ▼
Run Retrieval
     │
     ▼
Compare with Expected Sources
     │
     ▼
retrieval@5
```

Example golden dataset entry:

```json
{
  "question": "How is JWT authentication verified?",
  "expectedSource": "src/auth/auth.service.ts"
}
```

The evaluation checks whether the expected source appears within the top 5 retrieved results.

A result such as:

```text
PASS Where are refresh tokens rotated?
PASS How is JWT authentication verified?
PASS Where is order retry logic implemented?
PASS How are failed payments handled?

retrieval@5=1.00
```

means that, for the current golden evaluation dataset, every expected source was retrieved within the top five results.

---

# Project Flow

The complete request lifecycle is:

```text
                    INGESTION

Repository
    │
    ▼
Load Source Files
    │
    ▼
Chunk Source Code
    │
    ▼
Generate Embeddings
    │
    ▼
Store Chunks + Vectors
    │
    ▼
Elasticsearch


                  QUESTION ANSWERING

User Question
    │
    ├─────────────────────────────┐
    ▼                             ▼
BM25 Search                  Query Embedding
    │                             │
    ▼                             ▼
Keyword Results               Vector Search
    │                             │
    └──────────────┬──────────────┘
                   ▼
                RRF Fusion
                   │
                   ▼
             Candidate Chunks
                   │
                   ▼
                Reranking
                   │
                   ▼
             Relevant Context
                   │
                   ▼
                  LLM
                   │
                   ▼
        Grounded Answer + Citations
```

---

# Technology Stack

## AI and Retrieval

- OpenAI API
- OpenAI Embeddings
- Retrieval-Augmented Generation
- Semantic Search
- BM25
- Hybrid Search
- Reciprocal Rank Fusion
- Reranking
- Citation-Grounded Generation

## Search and Storage

- Elasticsearch
- Dense Vector Search
- HNSW Vector Indexing

## Backend

- Node.js
- TypeScript
- Zod

## Infrastructure

- Docker
- Docker Compose
- GitHub Actions

## Evaluation

- Golden Dataset
- Retrieval Evaluation
- `retrieval@5`
- RAGAS
- DeepEval

---

# Project Structure

```text
CodeRAG
│
├── src
│   ├── cli.ts
│   ├── config.ts
│   │
│   ├── ingest
│   │   ├── chunker.ts
│   │   └── index.ts
│   │
│   ├── retrieval
│   │   ├── search.ts
│   │   └── reranker.ts
│   │
│   ├── generation
│   │   └── answer.ts
│   │
│   ├── eval
│   │   └── run.ts
│   │
│   ├── lib
│   │   └── es.ts
│   │
│   └── observability
│       └── README.md
│
├── eval
│   ├── golden.json
│   ├── README.md
│   │
│   └── python
│       ├── ragas_deepeval.py
│       └── requirements.txt
│
├── sample-repo
│   └── src
│       ├── auth
│       ├── orders
│       └── payments
│
├── .github
│   └── workflows
│       └── evaluate.yml
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

# Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/tomalmandal/CodeRAG.git
cd CodeRAG
```

## 2. Install dependencies

```bash
pnpm install
```

## 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Add your API configuration:

```env
OPENAI_API_KEY=your_api_key
ELASTICSEARCH_URL=http://localhost:9200
```

---

# Start Elasticsearch

CodeRAG uses Elasticsearch for both keyword search and vector retrieval.

Start the service using Docker Compose:

```bash
docker compose up -d
```

Verify that Elasticsearch is running:

```bash
curl http://localhost:9200
```

---

# Ingest a Repository

The ingestion process loads source files, chunks the code, generates embeddings, and indexes the resulting documents.

```bash
pnpm ingest
```

Example:

```text
{ files: 4, chunks: 10 }
```

---

# Ask Questions

Ask natural-language questions about the indexed codebase:

```bash
pnpm ask "Where is authentication implemented?"
```

Another example:

```bash
pnpm ask "How are access tokens verified?"
```

The system performs hybrid retrieval, reranking, and answer generation before returning a response with source citations.

---

# Run Evaluation

Run the retrieval evaluation against the golden dataset:

```bash
pnpm evaluate
```

Example output:

```text
PASS Where are refresh tokens rotated?
PASS How is JWT authentication verified?
PASS Where is order retry logic implemented?
PASS How are failed payments handled?

retrieval@5=1.00
```

---

# Type Checking

```bash
pnpm typecheck
```

---

# Design Decisions

### Why Elasticsearch?

Elasticsearch provides both traditional full-text search and dense vector search, allowing keyword and semantic retrieval to operate within the same search infrastructure.

### Why Hybrid Search?

Exact identifiers are common in codebases, making BM25 useful for keyword-based retrieval. Semantic search complements this by handling natural-language questions that do not use the same terminology as the source code.

### Why RRF?

BM25 and vector search produce scores on different scales. Reciprocal Rank Fusion combines ranked results without directly comparing incompatible raw scores.

### Why Reranking?

Initial retrieval focuses on finding a broad set of potentially relevant candidates. Reranking improves precision before context is passed to the LLM.

### Why Store Source Metadata?

File paths and line numbers allow generated answers to reference the original source, improving traceability and making answers easier to verify.

### Why Evaluate Retrieval?

A RAG application can remain operational while retrieval quality silently degrades. Automated evaluation makes it possible to detect regressions when changing chunking, embedding, search, or ranking strategies.

---

# Future Extensions

- AST-aware code chunking
- Cross-encoder reranking
- Retrieval confidence thresholds
- Query classification and routing
- Multi-repository support
- Incremental repository indexing
- LangSmith and LangFuse tracing
- Cost and latency tracking
- CI quality thresholds for retrieval regression detection
- Interactive API and web interface

---

# Key Concepts Demonstrated

This project demonstrates practical implementation of:

- Retrieval-Augmented Generation
- Semantic Search
- Embeddings
- Vector Databases and Dense Vector Search
- BM25
- Hybrid Retrieval
- Reciprocal Rank Fusion
- Two-Stage Retrieval
- Reranking
- Citation-Grounded Generation
- Retrieval Evaluation
- Golden Datasets
- Retrieval@K Metrics
- Dockerized Search Infrastructure
- CI-based Quality Checks

---

## License

This project is intended for learning, experimentation, and portfolio demonstration.

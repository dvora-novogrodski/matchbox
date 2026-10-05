# services/ai

Python, FastAPI, LangGraph. One codebase, two deployments:

- **AI service** (`app.api.main`): synchronous operations (match, tailor, extract).
- **AI worker** (`app.worker.main`): async tasks delivered over HTTP (discover, indexing, ATS detection).

Internal AI design lives in the separate *Matchbox AI HLD*.

```
app/
  api/
    routes/       Sync endpoints; generates the OpenAPI spec (D5)
  worker/
    tasks/        discover, index, detect_ats, classify_email
  graphs/
    match/        A3 match analysis
    tailor/       A4 CV tailoring
    extract/      A2 posting extraction
  llm/            Provider interface (Gemini, Ollama), embeddings
  retrieval/      pgvector retrieval over career items
  connectors/     ATS connectors: comeet, greenhouse, lever, ashby
  db/             Access to domain tables; writes only to AI-owned tables (D1)
  schemas/        Pydantic request/response models
tests/
evals/
  datasets/       Offline eval sets for match scoring and tailoring faithfulness
```

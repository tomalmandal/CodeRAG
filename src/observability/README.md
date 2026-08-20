# Observability

The generation/retrieval boundaries are intentionally isolated so LangSmith and LangFuse tracing can wrap model/tool calls without changing retrieval logic. For a portfolio demo, enable tracing with the provider's environment variables and record query latency, token usage, model and retrieval stages.

The important architectural point is that observability is attached to the AI pipeline, not the UI.

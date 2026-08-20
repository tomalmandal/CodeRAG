# Evaluation

`golden.json` is the small regression set. `npm run evaluate` checks whether the expected source is present in top-5 retrieval results.

`python/ragas_deepeval.py` is the optional extension point for semantic metrics such as faithfulness, answer relevance and contextual precision/recall. Keeping the fast retrieval gate separate makes CI cheap while preserving a path to full RAGAS/DeepEval evaluation.

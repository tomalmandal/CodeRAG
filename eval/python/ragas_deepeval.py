"""Optional evaluation harness.

The TypeScript evaluator performs fast retrieval regression checks. This file is the
extension point for full RAGAS + DeepEval scoring using the same golden dataset.
Run it in a Python environment with requirements.txt installed after exporting
prediction/context JSON from the TypeScript pipeline.
"""
import json
from pathlib import Path

GOLDEN = Path(__file__).parents[1] / "golden.json"

def load_golden():
    return json.loads(GOLDEN.read_text())

if __name__ == "__main__":
    cases = load_golden()
    print(f"Loaded {len(cases)} golden cases.")
    print("Use the cases as the single source of truth for RAGAS/DeepEval regression runs.")

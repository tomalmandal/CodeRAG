export type Candidate = {
  id: string;
  text: string;
  path: string;
  startLine: number;
  endLine: number;
  score: number;
};
export interface Reranker {
  rerank(query: string, candidates: Candidate[]): Promise<Candidate[]>;
}
export class CrossEncoderReranker implements Reranker {
  async rerank(query: string, candidates: Candidate[]) {
    const endpoint = process.env.RERANKER_URL;
    if (endpoint) {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query,
          documents: candidates.map((c) => c.text),
        }),
      });
      if (r.ok) {
        const data = (await r.json()) as { scores: number[] };
        return candidates
          .map((c, i) => ({ ...c, score: data.scores[i] ?? 0 }))
          .sort((a, b) => b.score - a.score);
      }
    }
    return new LexicalFallback().rerank(query, candidates);
  }
}
class LexicalFallback implements Reranker {
  async rerank(q: string, c: Candidate[]) {
    const terms = new Set(q.toLowerCase().split(/\W+/).filter(Boolean));
    return c
      .map((x) => ({
        ...x,
        score: [...terms].reduce(
          (s, t) => s + (x.text.toLowerCase().includes(t) ? 1 : 0),
          0,
        ),
      }))
      .sort((a, b) => b.score - a.score);
  }
}

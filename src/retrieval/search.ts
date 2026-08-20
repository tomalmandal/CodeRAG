import { es } from "../lib/es.js";
import { config } from "../config.js";
import { OpenAI } from "openai";
import { CrossEncoderReranker, Candidate } from "./reranker.js";
const openai = new OpenAI({ apiKey: config.openaiKey });
const reranker = new CrossEncoderReranker();
async function vector(q: string) {
  const e = await openai.embeddings.create({
    model: config.embeddingModel,
    input: q,
  });
  return e.data[0].embedding;
}
function rrf(lists: Candidate[][], k = 60) {
  const m = new Map<string, Candidate & { rrf: number }>();
  lists.forEach((list) =>
    list.forEach((x, i) => {
      const v = m.get(x.id) || { ...x, rrf: 0 };
      v.rrf += 1 / (k + i + 1);
      m.set(x.id, v);
    }),
  );
  return [...m.values()].sort((a, b) => b.rrf - a.rrf);
}
export async function retrieve(query: string) {
  const [vec] = await Promise.all([vector(query), ensureBm25()]);
  const bm = await es.search({
    index: config.index,
    size: 15,
    query: { match: { text: { query } } },
    _source: ["text", "path", "startLine", "endLine"],
  });
  const knn = await es.search({
    index: config.index,
    size: 15,
    knn: {
      field: "embedding",
      query_vector: vec,
      k: 15,
      num_candidates: 50,
    },
    _source: ["text", "path", "startLine", "endLine"],
  });
  const map = (h: any): Candidate => ({
    id: h._id,
    text: h._source.text,
    path: h._source.path,
    startLine: h._source.startLine,
    endLine: h._source.endLine,
    score: h._score ?? 0,
  });
  const fused = rrf([bm.hits.hits.map(map), knn.hits.hits.map(map)]).slice(
    0,
    10,
  );
  return reranker.rerank(query, fused).then((x) => x.slice(0, 5));
}
async function ensureBm25() {
  return;
}

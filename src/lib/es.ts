import { Client } from "@elastic/elasticsearch";
import { config } from "../config.js";
export const es = new Client({ node: config.esUrl });
export async function ensureIndex() {
  const exists = await es.indices.exists({ index: config.index });
  if (!exists) {
    await es.indices.create({
      index: config.index,
      mappings: {
        properties: {
          text: { type: "text" },
          path: { type: "keyword" },
          startLine: { type: "integer" },
          endLine: { type: "integer" },
          kind: { type: "keyword" },
          embedding: {
            type: "dense_vector",
            dims: 1536,
            index: true,
            index_options: {
              type: "hnsw",
            },
          },
        },
      },
    });
  }
}

import "dotenv/config";
export const config={
  openaiKey:process.env.OPENAI_API_KEY||"", model:process.env.OPENAI_MODEL||"gpt-4o-mini", embeddingModel:process.env.OPENAI_EMBEDDING_MODEL||"text-embedding-3-small",
  esUrl:process.env.ELASTICSEARCH_URL||"http://localhost:9200", index:process.env.ELASTICSEARCH_INDEX||"coderag"
};

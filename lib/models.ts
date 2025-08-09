// Centralized OpenAI model configuration
// Defaults can be overridden via environment variables

export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-5'
// Upgrade default retrieval quality by using the larger embedding model
export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large'



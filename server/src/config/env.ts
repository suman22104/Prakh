export interface ServerConfig {
  port: number;
  nodeEnv: string;
  aiProvider: 'gemini' | 'groq' | 'ollama' | 'rules';
  geminiApiKey: string;
  geminiModel: string;
  groqApiKey: string;
  groqModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  allowedOrigins: string[];
}

export function loadServerConfig(): ServerConfig {
  const rawProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const aiProvider: ServerConfig['aiProvider'] =
    rawProvider === 'groq' || rawProvider === 'ollama' || rawProvider === 'rules'
      ? rawProvider
      : 'gemini';

  const allowedFromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (process.env.APP_URL) {
    allowedFromEnv.push(process.env.APP_URL.trim());
  }

  return {
    port: Number(process.env.PORT || 3000),
    nodeEnv: process.env.NODE_ENV || 'development',
    aiProvider,
    geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
    geminiModel: (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim(),
    groqApiKey: (process.env.GROQ_API_KEY || '').trim(),
    groqModel: (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim(),
    ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim(),
    ollamaModel: (process.env.OLLAMA_MODEL || 'llama3.2').trim(),
    allowedOrigins: Array.from(
      new Set(['http://localhost:3000', 'http://127.0.0.1:3000', ...allowedFromEnv])
    ),
  };
}

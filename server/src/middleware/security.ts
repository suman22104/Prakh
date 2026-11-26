import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';
import type { ServerConfig } from '../config/env';

export function applySecurityMiddleware(app: Express, config: ServerConfig) {
  app.set('trust proxy', 1);

  // Security headers compatible with iframe preview & Vite SPA
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Scoped CORS allowlist (never wildcard with credentials)
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          config.allowedOrigins.includes(origin) ||
          /^https:\/\/ais-(dev|pre)-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/i.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    })
  );

  // Rate limit for scam analysis endpoint
  const analyzeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 45,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      code: 'RATE_LIMITED',
      error: 'Too many check requests right now. Please wait a moment before trying again.',
    },
  });

  app.use('/api/analyze', analyzeLimiter);
}

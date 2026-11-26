import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { loadServerConfig } from './server/src/config/env';
import { applySecurityMiddleware } from './server/src/middleware/security';
import { createApiRouter } from './server/src/routes/api';

async function startServer() {
  const config = loadServerConfig();
  const app = express();
  const httpServer = http.createServer(app);

  applySecurityMiddleware(app, config);
  app.use(express.json({ limit: '64kb' }));

  // Mount REST API routes
  app.use('/api', createApiRouter(config));

  if (config.nodeEnv !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: hmrDisabled ? false : true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`Parakh listening on http://0.0.0.0:${config.port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

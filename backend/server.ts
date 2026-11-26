import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { loadServerConfig } from './src/config/env';
import { applySecurityMiddleware } from './src/middleware/security';
import { createApiRouter } from './src/routes/api';

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
    const frontendRoot = path.resolve(process.cwd(), 'frontend');
    const vite = await createViteServer({
      root: frontendRoot,
      configFile: path.join(frontendRoot, 'vite.config.ts'),
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: hmrDisabled ? false : true,
        allowedHosts: ['.loca.lt'],
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'frontend/dist');
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

import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './api/routes';
import { errorHandler } from './api/errors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', createApiRouter());

  const distPath = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^(?!\/api).*/, (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use(errorHandler);

  return app;
}

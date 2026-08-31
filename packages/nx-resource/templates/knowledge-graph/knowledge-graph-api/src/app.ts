// GitHub Copilot generated code - start
import express, { type Express } from 'express';

import { createPingController } from './features/ping/controller';

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use('/ping', createPingController());

  return app;
}
// GitHub Copilot generated code - end

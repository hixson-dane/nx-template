// GitHub Copilot generated code - start
import express from 'express';

import { createPingController } from './features/ping/controller';

export const createApp = () => {
  const app = express();

  app.get('/', (_req, res) => {
    res.send({ message: 'Hello API' });
  });

  app.use('/ping', createPingController());

  return app;
};
// GitHub Copilot generated code - end

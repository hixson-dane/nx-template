// GitHub Copilot generated code - start
import { Router } from 'express';

import { pingRequestSchema } from '@dev-portal/knowledge-graph-models';

import { createPingService } from './service';

export const createPingController = (): Router => {
  const router = Router();
  const service = createPingService();

  router.get('/', (request, response) => {
    pingRequestSchema.parse({
      query: request.query,
    });

    const payload = service.getHealth();
    return response.status(200).json(payload);
  });

  return router;
};
// GitHub Copilot generated code - end

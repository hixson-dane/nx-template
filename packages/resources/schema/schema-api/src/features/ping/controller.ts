// GitHub Copilot generated code - start
import { pingRequestSchema } from '@org/schema-models';
import { Request, Response, Router } from 'express';

import { createPingRepository } from '../repository';
import { PingService } from './service';

export const handlePingRequest =
  (pingService: PingService) =>
  (req: Request, res: Response): void => {
    pingRequestSchema.parse({ query: req.query ?? {} });

    const response = pingService.getPingResponse();

    res.status(200).json(response);
  };

export const createPingController = (): Router => {
  const router = Router();
  const pingService = new PingService(createPingRepository());

  router.get('/', handlePingRequest(pingService));

  return router;
};
// GitHub Copilot generated code - end

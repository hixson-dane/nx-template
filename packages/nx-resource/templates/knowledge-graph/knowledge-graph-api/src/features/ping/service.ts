// GitHub Copilot generated code - start
import {
  pingResponseSchema,
  type PingResponse,
} from '@dev-portal/knowledge-graph-models';

import { createPingRepository } from '../repository';

export interface PingService {
  getHealth(): PingResponse;
}

export const createPingService = (): PingService => {
  const repository = createPingRepository();

  return {
    getHealth: () => {
      const snapshot = repository.getHealthSnapshot();

      return pingResponseSchema.parse({
        status: 'ok',
        checkedAt: snapshot.checkedAt,
        uptimeSeconds: snapshot.uptimeSeconds,
      });
    },
  };
};
// GitHub Copilot generated code - end

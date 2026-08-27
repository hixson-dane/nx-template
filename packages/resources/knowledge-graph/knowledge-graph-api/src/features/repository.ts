// GitHub Copilot generated code - start
import { getRuntimeSnapshot } from '../shared/runtime';

export type PingRepositoryRecord = {
  checkedAt: string;
  uptimeSeconds: number;
};

export interface PingRepository {
  getHealthSnapshot(): PingRepositoryRecord;
}

export const createPingRepository = (): PingRepository => ({
  getHealthSnapshot: () => getRuntimeSnapshot(),
});
// GitHub Copilot generated code - end
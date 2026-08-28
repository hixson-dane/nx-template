// GitHub Copilot generated code - start
import { PingResponse, pingResponseSchema } from '@org/schema-models';
import { PingRepository } from '../repository';

export class PingService {
  constructor(private readonly repository: PingRepository) {}

  getPingResponse(): PingResponse {
    const snapshot = this.repository.getHealthSnapshot();

    return pingResponseSchema.parse({
      status: 'ok',
      checkedAt: snapshot.checkedAt,
      uptimeSeconds: snapshot.uptimeSeconds,
    });
  }
}
// GitHub Copilot generated code - end

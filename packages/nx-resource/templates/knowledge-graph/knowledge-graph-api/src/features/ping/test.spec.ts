// GitHub Copilot generated code - start
import { createPingService } from './service';

describe('createPingService', () => {
  it('returns a valid ping response payload', () => {
    const service = createPingService();

    const payload = service.getHealth();

    expect(payload.status).toBe('ok');
    expect(typeof payload.checkedAt).toBe('string');
    expect(payload.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
// GitHub Copilot generated code - end

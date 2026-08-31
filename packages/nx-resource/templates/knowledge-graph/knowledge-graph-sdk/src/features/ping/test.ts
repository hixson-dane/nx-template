// GitHub Copilot generated code - start
import { pingResponseSchema } from '@dev-portal/knowledge-graph-models';

describe('knowledge-graph-sdk ping models', () => {
  it('parses a valid ping response', () => {
    const payload = pingResponseSchema.parse({
      status: 'ok',
      checkedAt: '2026-01-01T00:00:00Z',
      uptimeSeconds: 1,
    });

    expect(payload.status).toBe('ok');
  });
});
// GitHub Copilot generated code - end

import { createKnowledgeGraphSdk, getPing, parsePingResponse } from './index';
import type { PingRequest, PingResponse } from './models';

// GitHub Copilot generated code - start
describe('getPing', () => {
  it('should call the ping endpoint and parse the payload', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        status: 'ok',
        checkedAt: '2026-01-01T00:00:00.000Z',
        uptimeSeconds: 123,
      }),
    }) as jest.MockedFunction<typeof fetch>;

    await expect(
      getPing({
        baseUrl: 'https://api.example.com',
        query: { source: 'sdk' },
        fetchFn,
      })
    ).resolves.toEqual({
      status: 'ok',
      checkedAt: '2026-01-01T00:00:00.000Z',
      uptimeSeconds: 123,
    });

    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/ping?source=sdk', {
      method: 'GET',
      headers: undefined,
      signal: undefined,
    });
  });

  it('should throw when the endpoint returns a non-success status', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({ error: 'service unavailable' }),
    }) as jest.MockedFunction<typeof fetch>;

    await expect(getPing({ baseUrl: 'https://api.example.com', fetchFn })).rejects.toThrow(
      'Ping request failed with status 503 Service Unavailable'
    );
  });
});

describe('parsePingResponse', () => {
  it('should reject an invalid ping payload', () => {
    expect(() =>
      parsePingResponse({
        status: 'ok',
        checkedAt: 'invalid-date',
        uptimeSeconds: -1,
      })
    ).toThrow();
  });
});

describe('createKnowledgeGraphSdk', () => {
  it('should call ping with the configured base URL', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        status: 'ok',
        checkedAt: '2026-01-01T00:00:00.000Z',
        uptimeSeconds: 42,
      }),
    }) as jest.MockedFunction<typeof fetch>;

    const sdk = createKnowledgeGraphSdk({
      baseUrl: 'https://api.example.com',
      fetchFn,
    });

    await expect(sdk.ping({ query: { source: 'initialized-sdk' } })).resolves.toEqual({
      status: 'ok',
      checkedAt: '2026-01-01T00:00:00.000Z',
      uptimeSeconds: 42,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/ping?source=initialized-sdk',
      {
        method: 'GET',
        headers: undefined,
        signal: undefined,
      }
    );
  });

  it('should merge sdk default headers with per-call headers', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        status: 'ok',
        checkedAt: '2026-01-01T00:00:00.000Z',
        uptimeSeconds: 7,
      }),
    }) as jest.MockedFunction<typeof fetch>;

    const sdk = createKnowledgeGraphSdk({
      baseUrl: 'https://api.example.com',
      fetchFn,
      headers: {
        authorization: 'Bearer token',
        'x-sdk': 'knowledge-graph',
      },
    });

    await sdk.ping({
      headers: {
        'x-request-id': 'req-123',
        'x-sdk': 'overridden-value',
      },
    });

    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/ping', {
      method: 'GET',
      headers: {
        authorization: 'Bearer token',
        'x-request-id': 'req-123',
        'x-sdk': 'overridden-value',
      },
      signal: undefined,
    });
  });
});

describe('ping models', () => {
  it('should expose ping request and response types', () => {
    const request: PingRequest = {
      query: { source: 'sdk' },
    };

    const response: PingResponse = {
      status: 'ok',
      checkedAt: '2026-01-01T00:00:00.000Z',
      uptimeSeconds: 5,
    };

    expect(request).toEqual({
      query: { source: 'sdk' },
    });

    expect(response).toEqual({
      status: 'ok',
      checkedAt: '2026-01-01T00:00:00.000Z',
      uptimeSeconds: 5,
    });
  });
});
// GitHub Copilot generated code - end
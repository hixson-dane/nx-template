// GitHub Copilot generated code - start
import { Request, Response } from 'express';

import { PingRepository } from '../repository';
import { handlePingRequest } from './controller';
import { PingService } from './service';

describe('PingService', () => {
  it('should return an ok health response from repository data', () => {
    const repository: PingRepository = {
      getHealthSnapshot: () => ({
        checkedAt: '2026-01-01T00:00:00.000Z',
        uptimeSeconds: 42,
      }),
    };

    const service = new PingService(repository);

    expect(service.getPingResponse()).toEqual({
      status: 'ok',
      checkedAt: '2026-01-01T00:00:00.000Z',
      uptimeSeconds: 42,
    });
  });
});

describe('handlePingRequest', () => {
  it('should write a 200 response with the ping payload', () => {
    const repository: PingRepository = {
      getHealthSnapshot: () => ({
        checkedAt: '2026-01-01T00:00:00.000Z',
        uptimeSeconds: 99,
      }),
    };
    const service = new PingService(repository);
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const response = { status, json } as unknown as Response;

    handlePingRequest(service)({} as Request, response);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      status: 'ok',
      checkedAt: '2026-01-01T00:00:00.000Z',
      uptimeSeconds: 99,
    });
  });
});
// GitHub Copilot generated code - end
// GitHub Copilot generated code - start
import { z } from 'zod';

export const pingRequestSchema = z.object({
  query: z.object({}).passthrough(),
});

export type PingRequest = z.infer<typeof pingRequestSchema>;

export const pingResponseSchema = z.object({
  status: z.literal('ok'),
  checkedAt: z.string().datetime({ offset: false }),
  uptimeSeconds: z.number().int().nonnegative(),
});

export type PingResponse = z.infer<typeof pingResponseSchema>;
// GitHub Copilot generated code - end

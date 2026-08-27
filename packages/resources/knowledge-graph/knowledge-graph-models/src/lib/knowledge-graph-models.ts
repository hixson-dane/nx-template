import { z } from 'zod';

// GitHub Copilot generated code - start
const isoUtcDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export const pingRequestSchema = z.object({
  query: z.object({}).passthrough(),
});

export type PingRequest = z.infer<typeof pingRequestSchema>;

export const pingResponseSchema = z.object({
  status: z.literal('ok'),
  checkedAt: z
    .string()
    .regex(isoUtcDateTimePattern, 'checkedAt must be an ISO-8601 UTC timestamp'),
  uptimeSeconds: z.number().int().nonnegative(),
});

export type PingResponse = z.infer<typeof pingResponseSchema>;
// GitHub Copilot generated code - end

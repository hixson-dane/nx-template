// GitHub Copilot generated code - start
import axios from 'axios';

import {
  pingResponseSchema,
  type PingResponse,
} from '@dev-portal/knowledge-graph-models';

export interface PingClientOptions {
  baseUrl: string;
}

export async function getPing(
  options: PingClientOptions
): Promise<PingResponse> {
  const response = await axios.get(`${options.baseUrl}/ping`);
  return pingResponseSchema.parse(response.data);
}
// GitHub Copilot generated code - end

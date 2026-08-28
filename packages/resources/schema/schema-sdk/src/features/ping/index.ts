import {
  PingResponse,
  pingRequestSchema,
  pingResponseSchema,
} from '@org/schema-models';

type PingFetch = typeof fetch;

export interface GetPingOptions {
  baseUrl: string;
  query?: Record<string, unknown>;
  fetchFn?: PingFetch;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// GitHub Copilot generated code - start
export type PingOperationOptions = Omit<GetPingOptions, 'baseUrl' | 'fetchFn'>;

export interface CreateSchemaSdkOptions {
  baseUrl: string;
  fetchFn?: PingFetch;
  headers?: Record<string, string>;
}

export interface SchemaSdk {
  ping(options?: PingOperationOptions): Promise<PingResponse>;
}

const createPingUrl = (
  baseUrl: string,
  query: Record<string, unknown>,
): string => {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = new URL('ping', normalizedBaseUrl);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === 'object') {
      url.searchParams.set(key, JSON.stringify(value));
      continue;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      url.searchParams.set(key, `${value}`);
    }
  }

  return url.toString();
};

export const parsePingResponse = (payload: unknown): PingResponse =>
  pingResponseSchema.parse(payload);

const mergeHeaders = (
  defaultHeaders?: Record<string, string>,
  requestHeaders?: Record<string, string>,
): Record<string, string> | undefined => {
  if (defaultHeaders && requestHeaders) {
    return {
      ...defaultHeaders,
      ...requestHeaders,
    };
  }

  if (defaultHeaders) {
    return { ...defaultHeaders };
  }

  if (requestHeaders) {
    return { ...requestHeaders };
  }

  return undefined;
};

export const getPing = async ({
  baseUrl,
  query = {},
  fetchFn = fetch,
  headers,
  signal,
}: GetPingOptions): Promise<PingResponse> => {
  const request = pingRequestSchema.parse({ query });

  const response = await fetchFn(createPingUrl(baseUrl, request.query), {
    method: 'GET',
    headers,
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Ping request failed with status ${response.status} ${response.statusText}`,
    );
  }

  return parsePingResponse(await response.json());
};

export const createSchemaSdk = ({
  baseUrl,
  fetchFn = fetch,
  headers,
}: CreateSchemaSdkOptions): SchemaSdk => ({
  ping: (options = {}) =>
    getPing({
      baseUrl,
      fetchFn,
      query: options.query,
      headers: mergeHeaders(headers, options.headers),
      signal: options.signal,
    }),
});
// GitHub Copilot generated code - end

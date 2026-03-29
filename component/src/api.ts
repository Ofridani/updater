import type { AlertStream, UpdaterAlert, UpdaterAlertViewPayload } from './types';

const DEFAULT_API_BASE_URL = new URL(import.meta.url).origin;

function resolveApiBaseUrl(apiUrl?: string) {
  const rawBaseUrl = apiUrl?.trim() || DEFAULT_API_BASE_URL;
  return rawBaseUrl.replace(/\/+$/, '');
}

function buildUrl(
  apiUrl: string | undefined,
  pathname: string,
  searchParams?: Record<string, string>,
) {
  const url = new URL(pathname.replace(/^\//, ''), `${resolveApiBaseUrl(apiUrl)}/`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

async function request<T>(input: URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Request failed with status ${response.status.toString()}.`,
    );
  }

  return (await response.json()) as T;
}

function serializeStreams(streams: AlertStream[]) {
  return streams.join(',');
}

export function fetchBannerAlertsByStreams(
  apiUrl: string | undefined,
  streams: AlertStream[],
) {
  return request<UpdaterAlert[]>(
    buildUrl(apiUrl, '/alerts/banner', {
      streams: serializeStreams(streams),
    }),
  );
}

export function fetchPopupAlerts(
  apiUrl: string | undefined,
  userId: string,
  streams: AlertStream[],
) {
  return request<UpdaterAlert[]>(
    buildUrl(apiUrl, '/alerts/popup', {
      userId,
      streams: serializeStreams(streams),
    }),
  );
}

export function createAlertView(
  apiUrl: string | undefined,
  payload: UpdaterAlertViewPayload,
) {
  return request<{ alertId: string; userId: string }>(buildUrl(apiUrl, '/alert-views'), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

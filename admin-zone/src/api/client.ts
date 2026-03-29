export type AlertType = 'incident' | 'resolution' | 'retroIncident';

export type AlertStream = 'earth' | 'water' | 'fire' | 'air';

export interface AlertTheme {
  bannerColor: string;
  bannerTextColor: string;
  popUpColor: string;
  popUpTextColor: string;
}

export interface AlertRecord {
  _id: string;
  type: AlertType;
  title: string;
  impact: string;
  description?: string;
  theme: AlertTheme;
  streams: AlertStream[];
  publishDate: string;
  status: 'active' | 'resolved' | null;
  resolution_incident_id: string | null;
  viewed?: boolean;
}

export interface CreateAlertPayload {
  type: AlertType;
  title: string;
  impact: string;
  description?: string;
  streams: AlertStream[];
  theme?: Partial<AlertTheme>;
  resolution_incident_id?: string;
}

export function normalizeApiBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

async function request<T>(input: URL, init?: RequestInit) {
  let response: Response;

  try {
    response = await fetch(input, {
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      ...init,
    });
  } catch {
    throw new Error(
      `Could not reach the updater API at ${input.origin}. Make sure the Nest API is running there.`,
    );
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status.toString()}.`);
  }

  return (await response.json()) as T;
}

function buildUrl(apiBaseUrl: string, pathname: string, search?: Record<string, string>) {
  const url = new URL(pathname.replace(/^\//, ''), `${normalizeApiBaseUrl(apiBaseUrl)}/`);

  if (search) {
    for (const [key, value] of Object.entries(search)) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

export function fetchActiveIncidents(apiBaseUrl: string) {
  return request<AlertRecord[]>(
    buildUrl(apiBaseUrl, '/alerts', {
      type: 'incident',
      status: 'active',
    }),
  );
}

export function createAlert(apiBaseUrl: string, payload: CreateAlertPayload) {
  return request<AlertRecord>(buildUrl(apiBaseUrl, '/alerts'), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

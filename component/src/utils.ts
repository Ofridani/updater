import type { AlertStream, AlertTheme, AlertType, UpdaterAlert } from './types';

const DEFAULT_ALERT_THEMES: Record<AlertType, AlertTheme> = {
  incident: {
    bannerColor: '#b42318',
    bannerTextColor: '#ffffff',
    popUpColor: '#fef3f2',
    popUpTextColor: '#7a271a',
  },
  resolution: {
    bannerColor: '#027a48',
    bannerTextColor: '#ffffff',
    popUpColor: '#ecfdf3',
    popUpTextColor: '#05603a',
  },
  retroIncident: {
    bannerColor: '#b54708',
    bannerTextColor: '#ffffff',
    popUpColor: '#fff7ed',
    popUpTextColor: '#9a3412',
  },
};

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const VALID_STREAMS: AlertStream[] = ['earth', 'water', 'fire', 'air'];

export function parsePollInterval(value?: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 60_000;
  }

  return parsedValue;
}

export function formatPublishDate(publishDate: string) {
  return formatter.format(new Date(publishDate));
}

export function resolveAlertTheme(alert: UpdaterAlert) {
  return {
    ...DEFAULT_ALERT_THEMES[alert.type],
    ...(alert.theme ?? {}),
  };
}

export function getAlertTypeLabel(type: AlertType) {
  switch (type) {
    case 'incident':
      return 'Incident';
    case 'resolution':
      return 'Resolution';
    case 'retroIncident':
      return 'Retro Incident';
  }
}

export function getAlertEyebrow(alert: UpdaterAlert) {
  if (alert.type === 'incident') {
    return 'Active incident';
  }

  if (alert.type === 'resolution') {
    return 'Issue resolved';
  }

  return 'Past incident report';
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected request failure.';
}

export function parseStreamSelection(value: unknown): AlertStream[] {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value.flatMap((entry) => parseStreamSelection(entry)).filter((stream) =>
          VALID_STREAMS.includes(stream),
        ),
      ),
    );
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return [];
  }

  if (trimmedValue.startsWith('[')) {
    try {
      return parseStreamSelection(JSON.parse(trimmedValue));
    } catch {
      return [];
    }
  }

  return Array.from(
    new Set(
      trimmedValue
        .split(',')
        .map((stream) => stream.trim())
        .filter((stream): stream is AlertStream =>
          VALID_STREAMS.includes(stream as AlertStream),
        ),
    ),
  );
}

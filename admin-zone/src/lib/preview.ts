import type { AlertStream, AlertTheme, AlertType } from '../api/client';

export const ALL_STREAMS: AlertStream[] = ['earth', 'water', 'fire', 'air'];

export const STREAM_OPTIONS = [
  { value: 'earth', label: 'Earth' },
  { value: 'water', label: 'Water' },
  { value: 'fire', label: 'Fire' },
  { value: 'air', label: 'Air' },
];

export const TYPE_OPTIONS = [
  { value: 'incident', label: 'Incident' },
  { value: 'resolution', label: 'Resolution' },
  { value: 'retroIncident', label: 'Retro Incident' },
];

export const DEFAULT_THEMES: Record<AlertType, AlertTheme> = {
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

export const previewDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function applyAirCascade(streams: AlertStream[]) {
  if (streams.includes('air')) {
    return ALL_STREAMS;
  }

  return Array.from(new Set(streams));
}

export function formatStreams(streams: AlertStream[]) {
  return streams.map((stream) => stream[0]!.toUpperCase() + stream.slice(1)).join(', ');
}

export function resolveTheme(type: AlertType, overrides?: Partial<AlertTheme>) {
  return {
    ...DEFAULT_THEMES[type],
    ...(overrides ?? {}),
  };
}

export function placeholderTitle(type: AlertType) {
  switch (type) {
    case 'incident':
      return 'Service disruption affecting users';
    case 'resolution':
      return 'Service disruption resolved';
    case 'retroIncident':
      return 'Earlier issue discovered after the fact';
  }
}

export function placeholderImpact(type: AlertType) {
  switch (type) {
    case 'incident':
      return 'Users may experience errors or degraded performance.';
    case 'resolution':
      return 'The earlier issue has been resolved and service is recovering.';
    case 'retroIncident':
      return 'A past issue occurred earlier, but is no longer active.';
  }
}

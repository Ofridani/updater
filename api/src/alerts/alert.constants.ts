export enum AlertType {
  INCIDENT = 'incident',
  RESOLUTION = 'resolution',
  RETRO_INCIDENT = 'retroIncident',
}

export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
}

export enum AlertStream {
  EARTH = 'earth',
  WATER = 'water',
  FIRE = 'fire',
  AIR = 'air',
}

export interface AlertThemePalette {
  bannerColor: string;
  bannerTextColor: string;
  popUpColor: string;
  popUpTextColor: string;
}

export const DEFAULT_ALERT_THEMES: Record<AlertType, AlertThemePalette> = {
  [AlertType.INCIDENT]: {
    bannerColor: '#b42318',
    bannerTextColor: '#ffffff',
    popUpColor: '#fef3f2',
    popUpTextColor: '#7a271a',
  },
  [AlertType.RESOLUTION]: {
    bannerColor: '#027a48',
    bannerTextColor: '#ffffff',
    popUpColor: '#ecfdf3',
    popUpTextColor: '#05603a',
  },
  [AlertType.RETRO_INCIDENT]: {
    bannerColor: '#b54708',
    bannerTextColor: '#ffffff',
    popUpColor: '#fff7ed',
    popUpTextColor: '#9a3412',
  },
};

export function resolveAlertTheme(
  type: AlertType,
  theme?: Partial<AlertThemePalette> | null,
): AlertThemePalette {
  return {
    ...DEFAULT_ALERT_THEMES[type],
    ...(theme ?? {}),
  };
}

export function normalizeAlertStreams(streams: AlertStream[]) {
  return Array.from(new Set(streams));
}

export function haveSameAlertStreams(
  leftStreams: AlertStream[],
  rightStreams: AlertStream[],
) {
  const normalizedLeft = normalizeAlertStreams(leftStreams).sort();
  const normalizedRight = normalizeAlertStreams(rightStreams).sort();

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((stream, index) => stream === normalizedRight[index]);
}

export function parseAlertStreams(value: unknown): string[] | undefined {
  if (value == null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const parsedValues = value.flatMap((entry) => parseAlertStreams(entry) ?? []);
    return parsedValues.length > 0 ? parsedValues : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue.startsWith('[')) {
    try {
      return parseAlertStreams(JSON.parse(trimmedValue));
    } catch {
      return undefined;
    }
  }

  const streams = trimmedValue
    .split(',')
    .map((stream) => stream.trim())
    .filter(Boolean);

  return streams.length > 0 ? streams : undefined;
}

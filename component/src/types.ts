export type AlertType = 'incident' | 'resolution' | 'retroIncident';

export type AlertStatus = 'active' | 'resolved' | null;

export type AlertStream = 'earth' | 'water' | 'fire' | 'air';

export interface AlertTheme {
  bannerColor: string;
  bannerTextColor: string;
  popUpColor: string;
  popUpTextColor: string;
}

export interface UpdaterAlert {
  _id: string;
  type: AlertType;
  title: string;
  impact: string;
  description?: string;
  theme: AlertTheme;
  streams: AlertStream[];
  publishDate: string;
  status: AlertStatus;
  resolution_incident_id: string | null;
  viewed?: boolean;
}

export interface UpdaterAlertViewPayload {
  alertId: string;
  userId: string;
}

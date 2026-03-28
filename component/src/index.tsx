import { customElement } from 'solid-element';

const containerStyle = {
  border: '1px solid #d0d7de',
  'border-radius': '12px',
  padding: '1rem',
  'font-family': 'system-ui, sans-serif',
  background: '#ffffff',
  color: '#111827',
};

customElement(
  'updater-alert-feed',
  {
    apiUrl: '',
    userId: '',
    title: 'Active alerts',
  },
  (props) => (
    <section style={containerStyle}>
      <strong>{props.title}</strong>
      <p>
        Placeholder alert feed component. It will later fetch live alert data from{' '}
        {props.apiUrl || 'the configured API'} for user {props.userId || 'anonymous'}.
      </p>
    </section>
  ),
);

customElement(
  'updater-alert-banner',
  {
    apiUrl: '',
    alertId: '',
    userId: '',
  },
  (props) => (
    <section style={containerStyle}>
      <strong>Updater alert banner</strong>
      <p>
        Placeholder banner component for alert {props.alertId || 'unknown'} using API{' '}
        {props.apiUrl || 'not configured'} and viewer {props.userId || 'anonymous'}.
      </p>
    </section>
  ),
);

export {};


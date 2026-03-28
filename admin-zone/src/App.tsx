const packages = [
  'admin-zone: React + Vite interface for publishing alerts',
  'api: NestJS service for alerts and alert views',
  'component: Solid-based web components distributable as a single script',
  'common: Shared types and helpers for the monorepo',
];

export default function App() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        margin: '0 auto',
        maxWidth: '56rem',
        padding: '3rem 1.5rem',
      }}
    >
      <h1>Updater Admin Zone</h1>
      <p>
        The workspace is initialized and ready for the alert publishing flow, API work,
        and reusable web components.
      </p>
      <ul>
        {packages.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  );
}


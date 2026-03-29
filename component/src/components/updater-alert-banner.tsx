import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { customElement } from 'solid-element';
import { fetchBannerAlertsByStreams } from '../api';
import type { UpdaterAlert } from '../types';
import {
  formatPublishDate,
  getAlertEyebrow,
  getErrorMessage,
  parsePollInterval,
  parseStreamSelection,
  resolveAlertTheme,
} from '../utils';

const styles = `
  :host {
    display: block;
  }

  * {
    box-sizing: border-box;
  }

  .banner {
    width: 100%;
    border: none;
    border-radius: 18px;
    cursor: pointer;
    display: grid;
    gap: 1rem;
    grid-template-columns: minmax(0, 1fr) auto;
    padding: 1rem 1.1rem;
    text-align: left;
  }

  .banner:focus-visible {
    outline: 3px solid rgba(15, 23, 42, 0.3);
    outline-offset: 2px;
  }

  .banner-copy {
    display: grid;
    gap: 0.35rem;
  }

  .eyebrow {
    font: 700 0.72rem/1.1 "Trebuchet MS", "Segoe UI", sans-serif;
    letter-spacing: 0.08em;
    opacity: 0.85;
    text-transform: uppercase;
  }

  .title {
    font: 700 1rem/1.2 Georgia, "Times New Roman", serif;
  }

  .impact,
  .description,
  .meta,
  .count-label {
    font: 500 0.92rem/1.4 "Segoe UI", sans-serif;
    opacity: 0.95;
  }

  .description {
    opacity: 0.88;
  }

  .meta {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .count {
    align-content: center;
    border-left: 1px solid rgba(255, 255, 255, 0.28);
    display: grid;
    min-width: 5.5rem;
    padding-left: 1rem;
    text-align: right;
  }

  .count-value {
    font: 700 1.45rem/1 "Segoe UI", sans-serif;
  }

  .count-label {
    font-size: 0.78rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
`;

customElement(
  'updater-alert-banner',
  {
    apiUrl: '',
    pollIntervalMs: '60000',
    streams: '',
  },
  (props) => {
    const [alerts, setAlerts] = createSignal<UpdaterAlert[]>([]);
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    const configuredStreams = createMemo(() => parseStreamSelection(props.streams));

    const currentAlert = createMemo(() => {
      const currentAlerts = alerts();

      if (currentAlerts.length === 0) {
        return null;
      }

      return currentAlerts[currentIndex() % currentAlerts.length] ?? null;
    });

    const refresh = async () => {
      if (configuredStreams().length === 0) {
        setAlerts([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const nextAlerts = await fetchBannerAlertsByStreams(
          props.apiUrl,
          configuredStreams(),
        );
        setAlerts(nextAlerts);
        setCurrentIndex((index) =>
          nextAlerts.length === 0 ? 0 : index % nextAlerts.length,
        );
        setError(null);
      } catch (refreshError) {
        setError(getErrorMessage(refreshError));
      } finally {
        setIsLoading(false);
      }
    };

    createEffect(() => {
      props.apiUrl;
      props.pollIntervalMs;
      props.streams;
      setIsLoading(true);
      void refresh();

      const intervalId = window.setInterval(() => {
        void refresh();
      }, parsePollInterval(props.pollIntervalMs));

      onCleanup(() => {
        window.clearInterval(intervalId);
      });
    });

    const goToNextAlert = () => {
      if (alerts().length > 1) {
        setCurrentIndex((index) => (index + 1) % alerts().length);
      }
    };

    return (
      <>
        <style>{styles}</style>
        <Show
          when={currentAlert()}
          fallback={
            <button
              class="banner"
              type="button"
              disabled
              style={{
                'background-color': error() ? '#fef2f2' : '#ecfdf3',
                color: error() ? '#991b1b' : '#065f46',
              }}
            >
              <div class="banner-copy">
                <span class="eyebrow">{error() ? 'Load issue' : 'No active incidents'}</span>
                <strong class="title">
                  {configuredStreams().length === 0
                    ? 'This banner needs at least one stream.'
                    : error()
                    ? 'Unable to load active alerts right now.'
                    : isLoading()
                      ? 'Loading active alerts...'
                      : 'There are no active incidents at the moment.'}
                </strong>
                <span class="impact">
                  {configuredStreams().length === 0
                    ? 'Pass a stream such as `earth`, `water`, `fire`, or `air` through the `streams` prop or attribute.'
                    : error()
                    ? error()
                    : 'The banner will automatically refresh when new incidents are published.'}
                </span>
              </div>
              <div class="count">
                <span class="count-value">0</span>
                <span class="count-label">active</span>
              </div>
            </button>
          }
        >
          {(alertAccessor) => {
            const alert = alertAccessor();
            const theme = createMemo(() => resolveAlertTheme(alert));

            return (
              <button
                class="banner"
                type="button"
                onClick={goToNextAlert}
                style={{
                  'background-color': theme().bannerColor,
                  color: theme().bannerTextColor,
                }}
              >
                <div class="banner-copy">
                  <span class="eyebrow">
                    {alerts().length > 1
                      ? `${getAlertEyebrow(alert)} - click to cycle`
                      : getAlertEyebrow(alert)}
                  </span>
                  <strong class="title">{alert.title}</strong>
                  <span class="impact">{alert.impact}</span>
                  <Show when={alert.description}>
                    <span class="description">{alert.description}</span>
                  </Show>
                  <span class="meta">
                    Published {formatPublishDate(alert.publishDate)}
                  </span>
                </div>
                <div class="count">
                  <span class="count-value">{alerts().length}</span>
                  <span class="count-label">active</span>
                </div>
              </button>
            );
          }}
        </Show>
      </>
    );
  },
);

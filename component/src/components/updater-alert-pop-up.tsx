import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { customElement } from 'solid-element';
import { createAlertView, fetchPopupAlerts } from '../api';
import type { UpdaterAlert } from '../types';
import {
  formatPublishDate,
  getAlertEyebrow,
  getAlertTypeLabel,
  getErrorMessage,
  parsePollInterval,
  parseStreamSelection,
  resolveAlertTheme,
} from '../utils';

const styles = `
  :host {
    display: block;
    height: 100%;
  }

  * {
    box-sizing: border-box;
  }

  .shell {
    display: flex;
    height: 100%;
    min-height: 18rem;
  }

  .card,
  .state {
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 22px;
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
    overflow: hidden;
    padding: 1.15rem;
  }

  .state {
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    color: #0f172a;
    justify-content: center;
  }

  .header {
    align-items: start;
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
  }

  .title-wrap {
    display: grid;
    gap: 0.4rem;
  }

  .eyebrow {
    font: 700 0.72rem/1.1 "Trebuchet MS", "Segoe UI", sans-serif;
    letter-spacing: 0.08em;
    opacity: 0.82;
    text-transform: uppercase;
  }

  .title {
    font: 700 1.55rem/1.1 Georgia, "Times New Roman", serif;
    margin: 0;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .badge {
    border: 1px solid currentColor;
    border-radius: 999px;
    display: inline-flex;
    font: 600 0.76rem/1 "Segoe UI", sans-serif;
    opacity: 0.78;
    padding: 0.4rem 0.65rem;
  }

  .close {
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    font: 700 1.1rem/1 "Segoe UI", sans-serif;
    opacity: 0.75;
    padding: 0.2rem;
  }

  .copy {
    display: grid;
    gap: 0.85rem;
  }

  .impact {
    font: 600 1rem/1.45 "Segoe UI", sans-serif;
    margin: 0;
  }

  .description {
    font: 500 0.96rem/1.6 "Segoe UI", sans-serif;
    margin: 0;
    opacity: 0.92;
    white-space: pre-wrap;
  }

  .meta {
    font: 500 0.86rem/1.4 "Segoe UI", sans-serif;
    opacity: 0.78;
  }

  .footer {
    align-items: end;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-top: auto;
  }

  .queue {
    display: grid;
    gap: 0.25rem;
  }

  .queue strong {
    font: 700 0.98rem/1.2 "Segoe UI", sans-serif;
  }

  .queue span {
    font: 500 0.82rem/1.4 "Segoe UI", sans-serif;
    opacity: 0.8;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
  }

  .action {
    appearance: none;
    background: rgba(15, 23, 42, 0.1);
    border: none;
    border-radius: 999px;
    color: inherit;
    cursor: pointer;
    font: 700 0.92rem/1 "Segoe UI", sans-serif;
    padding: 0.85rem 1.1rem;
  }

  .action.primary {
    background: rgba(15, 23, 42, 0.16);
  }
`;

customElement(
  'updater-alert-pop-up',
  {
    apiUrl: '',
    userId: '',
    pollIntervalMs: '60000',
    streams: '',
  },
  (props) => {
    const [queue, setQueue] = createSignal<UpdaterAlert[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    let dismissedInSession = new Set<string>();
    const configuredStreams = createMemo(() => parseStreamSelection(props.streams));

    const currentAlert = createMemo(() => queue()[0] ?? null);

    const mergeQueue = (incomingAlerts: UpdaterAlert[]) => {
      const nextQueue = incomingAlerts.filter(
        (alert) => !dismissedInSession.has(alert._id),
      );

      setQueue((existingAlerts) => {
        if (existingAlerts.length === 0) {
          return nextQueue;
        }

        const mergedAlerts = [...existingAlerts];
        const existingIds = new Set(existingAlerts.map((alert) => alert._id));

        for (const alert of nextQueue) {
          if (!existingIds.has(alert._id)) {
            mergedAlerts.push(alert);
          }
        }

        return mergedAlerts;
      });
    };

    const refresh = async () => {
      const userId = props.userId.trim();

      if (configuredStreams().length === 0) {
        setQueue([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!userId) {
        setQueue([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        const unseenAlerts = await fetchPopupAlerts(
          props.apiUrl,
          userId,
          configuredStreams(),
        );
        mergeQueue(unseenAlerts);
        setError(null);
      } catch (refreshError) {
        setError(getErrorMessage(refreshError));
      } finally {
        setIsLoading(false);
      }
    };

    createEffect(() => {
      props.apiUrl;
      props.userId;
      props.pollIntervalMs;
      props.streams;
      dismissedInSession = new Set<string>();
      setQueue([]);
      setError(null);
      setIsLoading(true);
      void refresh();

      const intervalId = window.setInterval(() => {
        void refresh();
      }, parsePollInterval(props.pollIntervalMs));

      onCleanup(() => {
        window.clearInterval(intervalId);
      });
    });

    const dismissCurrentAlert = async () => {
      const alert = currentAlert();
      const userId = props.userId.trim();

      if (!alert || !userId) {
        return;
      }

      dismissedInSession.add(alert._id);
      setQueue((existingAlerts) =>
        existingAlerts.filter((item) => item._id !== alert._id),
      );

      try {
        await createAlertView(props.apiUrl, {
          alertId: alert._id,
          userId,
        });
        setError(null);
      } catch (dismissError) {
        setError(getErrorMessage(dismissError));
      }
    };

    return (
      <>
        <style>{styles}</style>
        <div class="shell">
          <Show
            when={configuredStreams().length > 0}
            fallback={
              <section class="state">
                <strong class="title">Popup filtering needs streams</strong>
                <p class="impact">
                  Pass one or more streams such as `earth`, `water`, `fire`, or
                  `air` so this system only loads its own alert queue.
                </p>
              </section>
            }
          >
            <Show
              when={props.userId.trim()}
              fallback={
                <section class="state">
                  <strong class="title">Popup tracking needs a userId</strong>
                  <p class="impact">
                    Pass the parent app&apos;s user identifier through the `user-id`
                    attribute so the API can remember which alerts were already seen.
                  </p>
                </section>
              }
            >
              <Show
                when={currentAlert()}
                fallback={
                  <section class="state">
                    <span class="eyebrow">{error() ? 'Load issue' : 'All caught up'}</span>
                    <strong class="title">
                      {error()
                        ? 'Unable to refresh unseen alerts right now.'
                        : isLoading()
                          ? 'Loading unseen alerts...'
                          : 'There are no unseen alerts for this user.'}
                    </strong>
                    <p class="impact">
                      {error()
                        ? error()
                        : 'Active incidents still remain visible in the banner, but the popup queue is clear.'}
                    </p>
                  </section>
                }
              >
                {(alertAccessor) => {
                  const alert = createMemo(() => alertAccessor());
                  const theme = createMemo(() => resolveAlertTheme(alert()));

                  return (
                    <article
                      class="card"
                      style={{
                        'background-color': theme().popUpColor,
                        color: theme().popUpTextColor,
                      }}
                    >
                      <header class="header">
                        <div class="title-wrap">
                          <span class="eyebrow">{getAlertEyebrow(alert())}</span>
                          <h2 class="title">{alert().title}</h2>
                          <div class="badge-row">
                            <span class="badge">{getAlertTypeLabel(alert().type)}</span>
                            <Show when={alert().status}>
                              <span class="badge">{alert().status}</span>
                            </Show>
                          </div>
                        </div>
                        <button
                          class="close"
                          type="button"
                          onClick={dismissCurrentAlert}
                          aria-label="Dismiss alert"
                        >
                          X
                        </button>
                      </header>

                      <div class="copy">
                        <p class="impact">{alert().impact}</p>
                        <Show when={alert().description}>
                          <p class="description">{alert().description}</p>
                        </Show>
                        <span class="meta">
                          Published {formatPublishDate(alert().publishDate)}
                        </span>
                      </div>

                      <footer class="footer">
                        <div class="queue">
                          <strong>
                            {queue().length > 1
                              ? `${(queue().length - 1).toString()} more alert${queue().length - 1 === 1 ? '' : 's'} queued`
                              : 'Last unseen alert'}
                          </strong>
                          <span>
                            Dismissing this alert stores a view for this user and reveals the
                            next item in the queue.
                          </span>
                        </div>

                        <div class="actions">
                          <button class="action primary" type="button" onClick={dismissCurrentAlert}>
                            Understood
                          </button>
                        </div>
                      </footer>
                    </article>
                  );
                }}
              </Show>
            </Show>
          </Show>
        </div>
      </>
    );
  },
);

import { createElement, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  ColorInput,
  Container,
  Grid,
  Group,
  Loader,
  MultiSelect,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconAlertTriangle,
  IconArrowWaveRightUp,
  IconBroadcast,
  IconCheck,
  IconCloudStorm,
  IconFlame,
  IconRefresh,
  IconSend,
  IconWind,
} from '@tabler/icons-react';
import {
  type AlertRecord,
  type AlertStream,
  type AlertTheme,
  type AlertType,
  createAlert,
  fetchActiveIncidents,
  normalizeApiBaseUrl,
} from './api/client';
import {
  applyAirCascade,
  formatStreams,
  placeholderImpact,
  placeholderTitle,
  previewDateFormatter,
  resolveTheme,
  STREAM_OPTIONS,
  TYPE_OPTIONS,
} from './lib/preview';

type SubmissionNotice =
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }
  | null;

interface FormValues {
  apiBaseUrl: string;
  type: AlertType;
  streams: AlertStream[];
  title: string;
  impact: string;
  description: string;
  resolutionIncidentId: string | null;
  themeEnabled: boolean;
  bannerColor: string;
  bannerTextColor: string;
  popUpColor: string;
  popUpTextColor: string;
}

function buildThemeOverrides(values: FormValues) {
  if (!values.themeEnabled) {
    return undefined;
  }

  const theme: Partial<AlertTheme> = {
    bannerColor: values.bannerColor.trim() || undefined,
    bannerTextColor: values.bannerTextColor.trim() || undefined,
    popUpColor: values.popUpColor.trim() || undefined,
    popUpTextColor: values.popUpTextColor.trim() || undefined,
  };

  return Object.values(theme).some(Boolean) ? theme : undefined;
}

export default function App() {
  const [activeIncidents, setActiveIncidents] = useState<AlertRecord[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState<SubmissionNotice>(null);
  const [bundleStatus, setBundleStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [previewUserId, setPreviewUserId] = useState(`admin-preview-${Date.now()}`);
  const [livePreviewVersion, setLivePreviewVersion] = useState(0);

  const form = useForm<FormValues>({
    initialValues: {
      apiBaseUrl: 'http://localhost:4000',
      type: 'incident',
      streams: ['earth'],
      title: '',
      impact: '',
      description: '',
      resolutionIncidentId: null,
      themeEnabled: false,
      bannerColor: '',
      bannerTextColor: '',
      popUpColor: '',
      popUpTextColor: '',
    },
    validate: {
      apiBaseUrl: (value) => {
        try {
          new URL(normalizeApiBaseUrl(value));
          return null;
        } catch {
          return 'Enter a valid API base URL.';
        }
      },
      title: (value) => (value.trim() ? null : 'Title is required.'),
      impact: (value) => (value.trim() ? null : 'Impact is required.'),
      streams: (value, values) =>
        values.type === 'resolution' || applyAirCascade(value).length > 0
          ? null
          : 'Pick at least one stream.',
      resolutionIncidentId: (value, values) =>
        values.type === 'resolution' && !value
          ? 'Pick the incident this resolution closes.'
          : null,
    },
  });

  const normalizedApiBaseUrl = normalizeApiBaseUrl(form.values.apiBaseUrl || 'http://localhost:4000');
  const selectedResolutionIncident =
    activeIncidents.find((incident) => incident._id === form.values.resolutionIncidentId) ?? null;
  const effectiveStreams =
    form.values.type === 'resolution'
      ? selectedResolutionIncident?.streams ?? []
      : applyAirCascade(form.values.streams);
  const airCascadeActive = effectiveStreams.includes('air');
  const themeOverrides = buildThemeOverrides(form.values);
  const previewTheme = resolveTheme(form.values.type, themeOverrides);
  const draftTitle = form.values.title.trim() || placeholderTitle(form.values.type);
  const draftImpact = form.values.impact.trim() || placeholderImpact(form.values.type);
  const draftDescription = form.values.description.trim();

  const loadActiveIncidents = async () => {
    setIncidentsLoading(true);

    try {
      const incidents = await fetchActiveIncidents(normalizedApiBaseUrl);
      setActiveIncidents(incidents);
      setIncidentsError(null);

      if (
        form.values.resolutionIncidentId &&
        !incidents.some((incident) => incident._id === form.values.resolutionIncidentId)
      ) {
        form.setFieldValue('resolutionIncidentId', null);
      }
    } catch (error) {
      setIncidentsError(error instanceof Error ? error.message : 'Failed to load incidents.');
    } finally {
      setIncidentsLoading(false);
    }
  };

  useEffect(() => {
    if (form.values.type !== 'resolution') {
      setIncidentsError(null);
      return;
    }

    void loadActiveIncidents();
  }, [form.values.type, normalizedApiBaseUrl]);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.customElements.get('updater-alert-banner') &&
      window.customElements.get('updater-alert-pop-up')
    ) {
      setBundleStatus('ready');
      setBundleError(null);
      return;
    }

    const bundleUrl = `${normalizedApiBaseUrl}/components/component.es.js`;
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-updater-bundle="${bundleUrl}"]`,
    );

    setBundleStatus('loading');

    const handleLoad = () => {
      setBundleStatus('ready');
      setBundleError(null);
    };

    const handleError = () => {
      setBundleStatus('error');
      setBundleError(`Could not load the component bundle from ${bundleUrl}.`);
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });

      return () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = bundleUrl;
    script.dataset.updaterBundle = bundleUrl;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [normalizedApiBaseUrl]);

  const incidentOptions = activeIncidents.map((incident) => ({
    value: incident._id,
    label: `${incident.title} · ${formatStreams(incident.streams)}`,
  }));

  const publish = form.onSubmit(async (values) => {
    setSubmissionNotice(null);
    const finalStreams =
      values.type === 'resolution'
        ? selectedResolutionIncident?.streams ?? []
        : applyAirCascade(values.streams);

    if (finalStreams.length === 0) {
      form.setFieldError('streams', 'Pick at least one stream.');
      return;
    }

    setPublishing(true);

    try {
      const createdAlert = await createAlert(normalizedApiBaseUrl, {
        type: values.type,
        title: values.title.trim(),
        impact: values.impact.trim(),
        description: values.description.trim() || undefined,
        streams: finalStreams,
        theme: buildThemeOverrides(values),
        resolution_incident_id:
          values.type === 'resolution' ? values.resolutionIncidentId ?? undefined : undefined,
      });

      setSubmissionNotice({
        kind: 'success',
        message: `Published "${createdAlert.title}" to ${formatStreams(createdAlert.streams)}.`,
      });
      setPreviewUserId(`admin-preview-${Date.now()}`);
      setLivePreviewVersion((version) => version + 1);
      await loadActiveIncidents();
    } catch (error) {
      setSubmissionNotice({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed to publish alert.',
      });
    } finally {
      setPublishing(false);
    }
  });

  return (
    <Box
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(254, 215, 170, 0.55), transparent 30%), radial-gradient(circle at top right, rgba(191, 219, 254, 0.72), transparent 28%), linear-gradient(180deg, #fffaf0 0%, #eff6ff 100%)',
      }}
    >
      <Container size={1400} py={32}>
        <Stack gap="xl">
          <Paper radius={28} p="xl" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(20,33,61,0.08)', boxShadow: '0 24px 60px rgba(20,33,61,0.09)' }}>
            <Group justify="space-between" align="start" gap="lg">
              <Stack gap="sm">
                <Badge variant="light" color="orange" size="lg" leftSection={<IconBroadcast size={14} />}>
                  Element Group Admin Zone
                </Badge>
                <Title order={1} maw={760}>
                  Publish alerts with stream-aware previews before they reach the updater components
                </Title>
                <Text c="dimmed" maw={760}>
                  Compose an alert, preview it, and publish it directly into the updater API.
                </Text>
              </Stack>

              <Stack gap="xs" align="end">
                <Badge variant="outline" color="dark">API: {normalizedApiBaseUrl}</Badge>
                <Badge variant="outline" color="gray">Preview user: {previewUserId}</Badge>
              </Stack>
            </Group>
          </Paper>

          <Grid gutter="xl" align="start">
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Paper radius={28} p="xl" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(20,33,61,0.08)', boxShadow: '0 22px 48px rgba(20,33,61,0.08)' }}>
                <form onSubmit={publish}>
                  <Stack gap="lg">
                    <Group justify="space-between" align="start">
                      <Stack gap={2}>
                        <Title order={2}>Compose Alert</Title>
                        <Text c="dimmed" size="sm">Resolutions inherit streams from the incident they close.</Text>
                      </Stack>

                      <Button variant="light" color="gray" leftSection={<IconRefresh size={16} />} onClick={() => void loadActiveIncidents()} loading={incidentsLoading}>
                        Refresh incidents
                      </Button>
                    </Group>

                    <TextInput label="API base URL" placeholder="http://localhost:4000" {...form.getInputProps('apiBaseUrl')} />

                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <Select label="Alert type" data={TYPE_OPTIONS} allowDeselect={false} {...form.getInputProps('type')} />
                      <MultiSelect
                        label={form.values.type === 'resolution' ? 'Streams (inherited)' : 'Streams'}
                        data={STREAM_OPTIONS}
                        searchable
                        disabled={form.values.type === 'resolution'}
                        value={form.values.type === 'resolution' ? effectiveStreams : form.values.streams}
                        placeholder={form.values.type === 'resolution' ? 'Choose an incident first' : 'Pick one or more systems'}
                        onChange={(nextStreams) => {
                          if (form.values.type !== 'resolution') {
                            form.setFieldValue('streams', applyAirCascade(nextStreams as AlertStream[]));
                          }
                        }}
                        error={form.errors.streams}
                      />
                    </SimpleGrid>

                    {form.values.type === 'resolution' ? (
                      <Select
                        label="Incident to resolve"
                        searchable
                        clearable
                        placeholder={incidentsLoading ? 'Loading active incidents...' : 'Search active incidents'}
                        data={incidentOptions}
                        nothingFoundMessage="No active incidents found."
                        {...form.getInputProps('resolutionIncidentId')}
                      />
                    ) : null}

                    {selectedResolutionIncident ? (
                      <Alert radius="xl" color="orange" variant="light" icon={<IconArrowWaveRightUp size={18} />}>
                        This resolution inherits: <strong>{formatStreams(selectedResolutionIncident.streams)}</strong>
                      </Alert>
                    ) : null}

                    {airCascadeActive && form.values.type !== 'resolution' ? (
                      <Alert radius="xl" color="blue" variant="light" icon={<IconWind size={18} />}>
                        Air affects all systems, so it automatically expands this alert to every stream.
                      </Alert>
                    ) : null}

                    {incidentsError ? (
                      <Alert radius="xl" color="red" variant="light" icon={<IconAlertTriangle size={18} />}>
                        {incidentsError}
                      </Alert>
                    ) : null}

                    <TextInput label="Title" placeholder={placeholderTitle(form.values.type)} {...form.getInputProps('title')} />
                    <Textarea label="Impact" minRows={3} autosize placeholder={placeholderImpact(form.values.type)} {...form.getInputProps('impact')} />
                    <Textarea label="Description" minRows={4} autosize placeholder="Optional deeper context for admins and users." {...form.getInputProps('description')} />

                    <Card radius="xl" withBorder>
                      <Stack gap="md">
                        <Group justify="space-between">
                          <Stack gap={2}>
                            <Text fw={700}>Theme overrides</Text>
                            <Text size="sm" c="dimmed">Leave this off to use the default theme for the selected type.</Text>
                          </Stack>
                          <Switch checked={form.values.themeEnabled} onChange={(event) => form.setFieldValue('themeEnabled', event.currentTarget.checked)} onLabel="On" offLabel="Off" size="lg" />
                        </Group>

                        {form.values.themeEnabled ? (
                          <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <ColorInput label="Banner color" placeholder="#b42318" {...form.getInputProps('bannerColor')} />
                            <ColorInput label="Banner text color" placeholder="#ffffff" {...form.getInputProps('bannerTextColor')} />
                            <ColorInput label="Popup color" placeholder="#fef3f2" {...form.getInputProps('popUpColor')} />
                            <ColorInput label="Popup text color" placeholder="#7a271a" {...form.getInputProps('popUpTextColor')} />
                          </SimpleGrid>
                        ) : null}
                      </Stack>
                    </Card>

                    {submissionNotice ? (
                      <Alert radius="xl" color={submissionNotice.kind === 'success' ? 'green' : 'red'} variant="light" icon={submissionNotice.kind === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}>
                        {submissionNotice.message}
                      </Alert>
                    ) : null}

                    <Group justify="space-between" align="center">
                      <Text size="sm" c="dimmed">Publishing writes directly to MongoDB through the updater API.</Text>
                      <Button size="md" type="submit" loading={publishing} leftSection={<IconSend size={16} />}>
                        Send Alert
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Stack gap="xl">
                <Paper radius={28} p="xl" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(20,33,61,0.08)', boxShadow: '0 22px 48px rgba(20,33,61,0.08)' }}>
                  <Stack gap="lg">
                    <Stack gap={2}>
                      <Title order={2}>Draft Preview</Title>
                      <Text c="dimmed" size="sm">This preview reflects the alert you are composing before publish.</Text>
                    </Stack>

                    <SimpleGrid cols={{ base: 1, md: 2 }}>
                      <Card radius="xl" withBorder>
                        <Stack gap="md">
                          <Group justify="space-between">
                            <Text fw={700}>Banner</Text>
                            <Badge variant="light" color="gray">{form.values.type === 'incident' ? 'Visible' : 'Not shown'}</Badge>
                          </Group>

                          {form.values.type === 'incident' ? (
                            <Box style={{ background: previewTheme.bannerColor, color: previewTheme.bannerTextColor, borderRadius: 18, display: 'grid', gap: 12, gridTemplateColumns: '1fr auto', padding: '1rem 1.05rem' }}>
                              <Stack gap={6}>
                                <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: '0.08em' }}>Active incident</Text>
                                <Text fw={700} ff="Georgia, serif">{draftTitle}</Text>
                                <Text size="sm">{draftImpact}</Text>
                                {draftDescription ? <Text size="xs" opacity={0.85}>{draftDescription}</Text> : null}
                              </Stack>
                              <Stack align="end" gap={2}>
                                <Text fw={700} size="xl">1</Text>
                                <Text size="xs" tt="uppercase" style={{ letterSpacing: '0.06em' }}>active</Text>
                              </Stack>
                            </Box>
                          ) : (
                            <Alert radius="xl" color="gray" variant="light" icon={<IconCloudStorm size={18} />}>
                              This alert type does not render in the live banner because the banner only shows active incidents.
                            </Alert>
                          )}
                        </Stack>
                      </Card>

                      <Card radius="xl" withBorder>
                        <Stack gap="md">
                          <Group justify="space-between">
                            <Text fw={700}>Popup</Text>
                            <Badge variant="light" color={form.values.type === 'resolution' ? 'green' : 'orange'}>{form.values.type}</Badge>
                          </Group>

                          <Box style={{ background: previewTheme.popUpColor, color: previewTheme.popUpTextColor, border: '1px solid rgba(20,33,61,0.08)', borderRadius: 22, display: 'grid', gap: 16, minHeight: 280, padding: '1.1rem' }}>
                            <Group justify="space-between" align="start">
                              <Stack gap={6}>
                                <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                                  {form.values.type === 'resolution' ? 'Issue resolved' : form.values.type === 'retroIncident' ? 'Past incident report' : 'Active incident'}
                                </Text>
                                <Text fw={700} fz="1.35rem" ff="Georgia, serif">{draftTitle}</Text>
                              </Stack>
                              <ThemeIcon variant="light" radius="xl" color="dark">
                                {form.values.type === 'incident' ? <IconAlertTriangle size={16} /> : form.values.type === 'resolution' ? <IconCheck size={16} /> : <IconFlame size={16} />}
                              </ThemeIcon>
                            </Group>

                            <Stack gap="sm">
                              <Text fw={600}>{draftImpact}</Text>
                              {draftDescription ? <Text size="sm" opacity={0.9}>{draftDescription}</Text> : null}
                              <Group gap="xs">
                                <Badge variant="outline" color="dark">{form.values.type}</Badge>
                                <Badge variant="outline" color="dark">{effectiveStreams.length > 0 ? formatStreams(effectiveStreams) : 'No streams yet'}</Badge>
                              </Group>
                            </Stack>

                            <Group justify="space-between" align="end" mt="auto">
                              <Text size="xs" opacity={0.75}>Preview publish time: {previewDateFormatter.format(new Date())}</Text>
                              <Button variant="light" color="dark" radius="xl">Understood</Button>
                            </Group>
                          </Box>
                        </Stack>
                      </Card>
                    </SimpleGrid>
                  </Stack>
                </Paper>

                <Paper radius={28} p="xl" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(20,33,61,0.08)', boxShadow: '0 22px 48px rgba(20,33,61,0.08)' }}>
                  <Stack gap="lg">
                    <Group justify="space-between" align="start">
                      <Stack gap={2}>
                        <Title order={2}>Live Component Preview</Title>
                        <Text c="dimmed" size="sm">This uses the actual published component bundle served by the API.</Text>
                      </Stack>
                      <Button variant="light" color="gray" leftSection={<IconRefresh size={16} />} onClick={() => {
                        setPreviewUserId(`admin-preview-${Date.now()}`);
                        setLivePreviewVersion((version) => version + 1);
                      }}>
                        New preview user
                      </Button>
                    </Group>

                    <Alert radius="xl" color="blue" variant="light" icon={<IconBroadcast size={18} />}>
                      Current preview streams: <strong>{effectiveStreams.length > 0 ? formatStreams(effectiveStreams) : 'No streams selected yet'}</strong>
                    </Alert>

                    {bundleStatus === 'loading' ? <Group justify="center" py="xl"><Loader color="orange" /></Group> : null}
                    {bundleStatus === 'error' ? <Alert radius="xl" color="red" variant="light" icon={<IconAlertTriangle size={18} />}>{bundleError}</Alert> : null}

                    {bundleStatus === 'ready' && effectiveStreams.length > 0 ? (
                      <Stack gap="lg">
                        <Card radius="xl" withBorder>
                          <Stack gap="md">
                            <Text fw={700}>Published banner for selected streams</Text>
                            {createElement('updater-alert-banner', {
                              key: `live-banner-${livePreviewVersion}`,
                              'api-url': normalizedApiBaseUrl,
                              streams: JSON.stringify(effectiveStreams),
                              'poll-interval-ms': '15000',
                            })}
                          </Stack>
                        </Card>

                        <Card radius="xl" withBorder style={{ minHeight: 420 }}>
                          <Stack gap="md">
                            <Text fw={700}>Published popup for selected streams</Text>
                            {createElement('updater-alert-pop-up', {
                              key: `live-popup-${livePreviewVersion}-${previewUserId}`,
                              'api-url': normalizedApiBaseUrl,
                              'user-id': previewUserId,
                              streams: JSON.stringify(effectiveStreams),
                              'poll-interval-ms': '15000',
                            })}
                          </Stack>
                        </Card>
                      </Stack>
                    ) : null}

                    {bundleStatus === 'ready' && effectiveStreams.length === 0 ? (
                      <Alert radius="xl" color="gray" variant="light" icon={<IconCloudStorm size={18} />}>
                        Pick streams, or choose a resolution incident, to render the live component preview.
                      </Alert>
                    ) : null}
                  </Stack>
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

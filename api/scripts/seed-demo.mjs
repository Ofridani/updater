import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/updater';

const alertThemeSchema = new mongoose.Schema(
  {
    bannerColor: String,
    bannerTextColor: String,
    popUpColor: String,
    popUpTextColor: String,
  },
  { _id: false },
);

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    impact: {
      type: String,
      required: true,
    },
    description: String,
    theme: alertThemeSchema,
    streams: {
      type: [String],
      required: true,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      default: null,
    },
    resolution_incident_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    collection: 'alerts',
    versionKey: false,
  },
);

const alertViewSchema = new mongoose.Schema(
  {
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'alert-views',
    versionKey: false,
  },
);

const Alert = mongoose.model('SeedAlert', alertSchema);
const AlertView = mongoose.model('SeedAlertView', alertViewSchema);

const now = Date.now();

const seed = async () => {
  await mongoose.connect(mongoUri);

  await Alert.deleteMany({});
  await AlertView.deleteMany({});

  const activeEarthIncident = await Alert.create({
    type: 'incident',
    title: 'Earth payments are delayed',
    impact: 'Earth users may see payment confirmation delays.',
    description: 'The payment queue is processing slower than normal in the earth system.',
    streams: ['earth'],
    publishDate: new Date(now - 1000 * 60 * 12),
    status: 'active',
  });

  await Alert.create({
    type: 'incident',
    title: 'Water media uploads are degraded',
    impact: 'Water uploads may take longer than expected.',
    description: 'Storage replication is catching up after a traffic spike.',
    streams: ['water'],
    publishDate: new Date(now - 1000 * 60 * 8),
    status: 'active',
  });

  await Alert.create({
    type: 'incident',
    title: 'Shared search latency across earth and air',
    impact: 'Earth and air search requests may be delayed.',
    description: 'A shared indexing worker is currently overloaded.',
    streams: ['earth', 'air'],
    publishDate: new Date(now - 1000 * 60 * 5),
    status: 'active',
  });

  const resolvedEarthIncident = await Alert.create({
    type: 'incident',
    title: 'Earth sign-in disruption',
    impact: 'Some earth users were unable to sign in earlier today.',
    description: 'The authentication gateway was intermittently rejecting valid sessions.',
    streams: ['earth'],
    publishDate: new Date(now - 1000 * 60 * 30),
    status: 'resolved',
  });

  await Alert.create({
    type: 'resolution',
    title: 'Earth sign-in disruption resolved',
    impact: 'Sign-in is back to normal for earth users.',
    description: 'The gateway configuration has been corrected and sessions are stable again.',
    streams: ['earth'],
    publishDate: new Date(now - 1000 * 60 * 20),
    status: null,
    resolution_incident_id: resolvedEarthIncident._id,
  });

  await Alert.create({
    type: 'retroIncident',
    title: 'Fire reporting delays earlier today',
    impact: 'A past reporting lag affected fire dashboards.',
    description: 'The issue has already passed, but it was detected after the fact.',
    streams: ['fire'],
    publishDate: new Date(now - 1000 * 60 * 15),
    status: 'resolved',
  });

  console.log('Seeded updater demo data.');
  console.log(`MongoDB: ${mongoUri}`);
  console.log(`Active earth incident id: ${activeEarthIncident._id.toString()}`);

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error('Failed to seed updater demo data.');
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});

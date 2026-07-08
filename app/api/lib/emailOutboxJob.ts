export const EMAIL_OUTBOX_JOB_PATH = '/api/jobs/email-outbox';
export const EMAIL_OUTBOX_JOB_METHODS = 'POST, OPTIONS';

export const EMAIL_OUTBOX_JOB_PROBE = {
  path: EMAIL_OUTBOX_JOB_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  cronAuthRequired: true,
  batchLimit: 20,
  pendingStatus: 'pending' as const,
  sentStatus: 'sent' as const,
  failedStatus: 'failed' as const,
  maxLastErrorLength: 1200,
};
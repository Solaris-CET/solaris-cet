export const SERVICE_STATUS_PATH = '/api/status';
export const SERVICE_STATUS_METHODS = 'GET, OPTIONS';

export const SERVICE_STATUS_PROBE = {
  path: SERVICE_STATUS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'no-store' as const,
  aiConfiguredLabel: 'configured' as const,
  aiMissingLabel: 'missing_keys' as const,
  tonConfiguredLabel: 'configured' as const,
  tonNotConfiguredLabel: 'not_configured' as const,
};

export type ServiceStatusSnapshot = {
  ok: true;
  ai: typeof SERVICE_STATUS_PROBE.aiConfiguredLabel | typeof SERVICE_STATUS_PROBE.aiMissingLabel;
  ton: typeof SERVICE_STATUS_PROBE.tonConfiguredLabel | typeof SERVICE_STATUS_PROBE.tonNotConfiguredLabel;
  env: {
    ai: {
      grokKey: boolean;
      grokKeyEnc: boolean;
      geminiKey: boolean;
      geminiKeyEnc: boolean;
      encryptionSecret: boolean;
    };
    ton: {
      rpcUrl: boolean;
      apiKey: boolean;
    };
  };
  time: string;
};

function readTrimmedEnv(name: string): string {
  return String(process.env[name] ?? '').trim();
}

export function collectServiceStatusSnapshot(now = new Date()): ServiceStatusSnapshot {
  const hasEncSecret = Boolean(readTrimmedEnv('ENCRYPTION_SECRET'));
  const hasGrokPlain = Boolean(readTrimmedEnv('GROK_API_KEY'));
  const hasGrokEnc = Boolean(readTrimmedEnv('GROK_API_KEY_ENC'));
  const hasGeminiPlain = Boolean(readTrimmedEnv('GEMINI_API_KEY'));
  const hasGeminiEnc = Boolean(readTrimmedEnv('GEMINI_API_KEY_ENC'));
  const hasAiKey = Boolean(
    (hasGrokPlain || (hasGrokEnc && hasEncSecret)) && (hasGeminiPlain || (hasGeminiEnc && hasEncSecret)),
  );
  const hasTonRpc = Boolean(readTrimmedEnv('TONCENTER_RPC_URL'));

  return {
    ok: true,
    ai: hasAiKey ? SERVICE_STATUS_PROBE.aiConfiguredLabel : SERVICE_STATUS_PROBE.aiMissingLabel,
    ton: hasTonRpc ? SERVICE_STATUS_PROBE.tonConfiguredLabel : SERVICE_STATUS_PROBE.tonNotConfiguredLabel,
    env: {
      ai: {
        grokKey: hasGrokPlain,
        grokKeyEnc: hasGrokEnc,
        geminiKey: hasGeminiPlain,
        geminiKeyEnc: hasGeminiEnc,
        encryptionSecret: hasEncSecret,
      },
      ton: {
        rpcUrl: hasTonRpc,
        apiKey: Boolean(readTrimmedEnv('TONCENTER_API_KEY')),
      },
    },
    time: now.toISOString(),
  };
}
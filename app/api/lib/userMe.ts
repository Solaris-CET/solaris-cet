export const USER_ME_PATH = '/api/me';
export const USER_ME_METHODS = 'GET, OPTIONS';

export const USER_ME_PROBE = {
  path: USER_ME_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  defaultLocale: 'ro' as const,
  defaultTheme: 'dark' as const,
};

export type UserMeAuthContext = {
  user: {
    id: string;
    walletAddress: string | null;
    role: string;
    points: number;
    referralCode: string | null;
    createdAt: Date;
  };
  mfaEnabled: boolean;
};

export type UserMeSettings = {
  displayName: string | null;
  email: string | null;
  emailRemindersEnabled: boolean;
  telegramNotificationsEnabled: boolean;
  locale: string;
  theme: string;
} | null;

export type UserMeTelegram = {
  linked: boolean;
  username: string | null;
  chatId: string | null;
};

export function buildUserMePayload(params: {
  ctx: UserMeAuthContext;
  settings: UserMeSettings;
  telegram: UserMeTelegram;
  referralsCount: number;
}) {
  const { ctx, settings, telegram, referralsCount } = params;
  return {
    user: {
      id: ctx.user.id,
      walletAddress: ctx.user.walletAddress,
      role: ctx.user.role,
      points: ctx.user.points,
      referralCode: ctx.user.referralCode,
      createdAt: ctx.user.createdAt,
    },
    settings: {
      displayName: settings?.displayName ?? null,
      email: settings?.email ?? null,
      emailRemindersEnabled: settings?.emailRemindersEnabled ?? false,
      telegramNotificationsEnabled: settings?.telegramNotificationsEnabled ?? true,
      locale: settings?.locale ?? USER_ME_PROBE.defaultLocale,
      theme: settings?.theme ?? USER_ME_PROBE.defaultTheme,
    },
    telegram,
    stats: {
      referralsCount,
      mfaEnabled: ctx.mfaEnabled,
    },
  };
}

export function normalizeReferralsCount(raw: unknown): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
}
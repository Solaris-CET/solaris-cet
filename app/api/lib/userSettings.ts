export const USER_SETTINGS_PATH = '/api/user/settings';
export const USER_SETTINGS_METHODS = 'POST, OPTIONS';

export const USER_SETTINGS_PROBE = {
  path: USER_SETTINGS_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  allowHeaders: 'Content-Type, Authorization' as const,
  allowedLocales: ['en', 'ro', 'es'] as const,
  allowedThemes: ['dark', 'light', 'system'] as const,
  defaultLocale: 'ro' as const,
  defaultTheme: 'dark' as const,
  maxDisplayNameLength: 60,
  maxEmailLength: 254,
};

export type UserSettingsPatch = {
  displayName: string | null;
  email: string | null;
  emailRemindersEnabled: boolean | null;
  telegramNotificationsEnabled: boolean | null;
  locale: (typeof USER_SETTINGS_PROBE.allowedLocales)[number] | null;
  theme: (typeof USER_SETTINGS_PROBE.allowedThemes)[number] | null;
};

export function parseUserSettingsBody(body: unknown): UserSettingsPatch {
  const displayNameRaw =
    typeof body === 'object' && body !== null && 'displayName' in body && typeof (body as { displayName?: unknown }).displayName === 'string'
      ? (body as { displayName: string }).displayName.trim().slice(0, USER_SETTINGS_PROBE.maxDisplayNameLength)
      : null;
  const emailRaw =
    typeof body === 'object' && body !== null && 'email' in body && typeof (body as { email?: unknown }).email === 'string'
      ? (body as { email: string }).email.trim().slice(0, USER_SETTINGS_PROBE.maxEmailLength)
      : null;
  const emailRemindersEnabled =
    typeof body === 'object' && body !== null && 'emailRemindersEnabled' in body
      ? Boolean((body as { emailRemindersEnabled?: unknown }).emailRemindersEnabled)
      : null;
  const telegramNotificationsEnabled =
    typeof body === 'object' && body !== null && 'telegramNotificationsEnabled' in body
      ? Boolean((body as { telegramNotificationsEnabled?: unknown }).telegramNotificationsEnabled)
      : null;

  const localeRaw =
    typeof body === 'object' && body !== null && 'locale' in body && typeof (body as { locale?: unknown }).locale === 'string'
      ? (body as { locale: string }).locale.trim().toLowerCase().slice(0, 5)
      : null;
  const locale =
    localeRaw && (USER_SETTINGS_PROBE.allowedLocales as readonly string[]).includes(localeRaw)
      ? (localeRaw as UserSettingsPatch['locale'])
      : null;

  const themeRaw =
    typeof body === 'object' && body !== null && 'theme' in body && typeof (body as { theme?: unknown }).theme === 'string'
      ? (body as { theme: string }).theme.trim().toLowerCase().slice(0, 10)
      : null;
  const theme =
    themeRaw && (USER_SETTINGS_PROBE.allowedThemes as readonly string[]).includes(themeRaw)
      ? (themeRaw as UserSettingsPatch['theme'])
      : null;

  return {
    displayName: displayNameRaw,
    email: emailRaw,
    emailRemindersEnabled,
    telegramNotificationsEnabled,
    locale,
    theme,
  };
}

export function buildUserSettingsInsertValues(userId: string, patch: UserSettingsPatch) {
  return {
    userId,
    displayName: patch.displayName,
    email: patch.email,
    emailRemindersEnabled: patch.emailRemindersEnabled ?? false,
    telegramNotificationsEnabled: patch.telegramNotificationsEnabled ?? true,
    locale: patch.locale ?? USER_SETTINGS_PROBE.defaultLocale,
    theme: patch.theme ?? USER_SETTINGS_PROBE.defaultTheme,
  };
}

export function buildUserSettingsUpdateValues(
  existing: {
    displayName: string | null;
    email: string | null;
    emailRemindersEnabled: boolean;
    telegramNotificationsEnabled: boolean;
    locale: string;
    theme: string;
  },
  patch: UserSettingsPatch,
) {
  return {
    displayName: patch.displayName ?? existing.displayName,
    email: patch.email ?? existing.email,
    emailRemindersEnabled: patch.emailRemindersEnabled ?? existing.emailRemindersEnabled,
    telegramNotificationsEnabled: patch.telegramNotificationsEnabled ?? existing.telegramNotificationsEnabled,
    locale: patch.locale ?? existing.locale,
    theme: patch.theme ?? existing.theme,
    updatedAt: new Date(),
  };
}

export function detectUserSettingsChanges(
  existing: {
    email: string | null;
    telegramNotificationsEnabled: boolean;
    locale: string;
    theme: string;
  },
  patch: UserSettingsPatch,
) {
  const changedEmail = (patch.email ?? existing.email) !== existing.email;
  const changedTelegram = (patch.telegramNotificationsEnabled ?? existing.telegramNotificationsEnabled) !== existing.telegramNotificationsEnabled;
  const changedLocale = (patch.locale ?? existing.locale) !== existing.locale;
  const changedTheme = (patch.theme ?? existing.theme) !== existing.theme;
  return { changedEmail, changedTelegram, changedLocale, changedTheme };
}

export function buildUserSettingsNotifyParts(changes: {
  changedEmail: boolean;
  changedTelegram: boolean;
  changedLocale: boolean;
  changedTheme: boolean;
}): string[] {
  const parts: string[] = [];
  if (changes.changedEmail) parts.push('email');
  if (changes.changedTelegram) parts.push('notificări');
  if (changes.changedLocale) parts.push('limbă');
  if (changes.changedTheme) parts.push('temă');
  return parts;
}
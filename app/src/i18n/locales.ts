export const LOCALES = ['en', 'ro', 'de', 'es'] as const;

export type LocaleCode = (typeof LOCALES)[number];

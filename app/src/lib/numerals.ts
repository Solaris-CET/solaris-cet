import type { LangCode } from "@/i18n/translations"
import { CET_FIXED_SUPPLY_CAP, TASK_AGENT_MESH_TOTAL } from "@/lib/domainPillars"

/** Replace `{key}` placeholders in i18n strings (e.g. `{sample}`, `{honest}`). */
export function interpolatePlaceholders(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  )
}

const localeByLang: Record<LangCode, string> = {
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
  ru: "ru-RU",
  ro: "ro-RO",
  pt: "pt-PT",
  de: "de-DE",
}

/**
 * Locale-aware integer formatting for CET supply and similar figures.
 * Uses `Intl.NumberFormat` (no extra font files; respects numeral system per locale).
 */
export function formatCetInteger(amount: number, lang: LangCode): string {
  const locale = localeByLang[lang] ?? "en-US"
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount)
}

/** Locale-aware decimals for illustrative metrics (e.g. CET/ha on the terrain demo). */
export function formatCetDecimal(
  amount: number,
  lang: LangCode,
  fractionDigits = 2,
): string {
  const locale = localeByLang[lang] ?? "en-US"
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount)
}

/** Display string for fixed CET supply cap in the active UI locale. */
export function formatCetSupplyWithSuffix(lang: LangCode): string {
  return `${formatCetInteger(CET_FIXED_SUPPLY_CAP, lang)} CET`
}

/** Locale-formatted ~200k task-agent headcount with trailing + (hero ticker, etc.). */
export function formatTaskAgentMeshHeadline(lang: LangCode): string {
  return `${formatCetInteger(TASK_AGENT_MESH_TOTAL, lang)}+`
}

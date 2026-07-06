import type { LangCode } from "@/i18n/translations"

/**
 * Document text direction for `<html dir="...">`.
 * All current `LangCode` values are LTR; extend when Arabic/Hebrew locales ship.
 */
export function getTextDirForLang(_lang: LangCode): "ltr" | "rtl" {
  void _lang
  return "ltr"
}

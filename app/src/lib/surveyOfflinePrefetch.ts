import { SURVEY_OFFLINE_PREFETCH_URLS } from './surveyOfflineManifest';

export const MAX_PREFETCH_URLS = 60;
export const PREFETCH_MESSAGE_TYPE = 'PREFETCH_URLS' as const;
export const PROBE_SURVEY_SHELL_TYPE = 'PROBE_SURVEY_SHELL' as const;
export const PROBE_SURVEY_SHELL_RESULT_TYPE = 'PROBE_SURVEY_SHELL_RESULT' as const;
export const PROBE_SURVEY_SHELL_TIMEOUT_MS = 4000;

export function mergePrefetchUrls(extraUrls: string[] = []): string[] {
  return [...SURVEY_OFFLINE_PREFETCH_URLS, ...extraUrls].slice(0, MAX_PREFETCH_URLS);
}

export function isProbeSurveyShellResult(data: unknown): data is { type: typeof PROBE_SURVEY_SHELL_RESULT_TYPE; ok?: boolean } {
  if (!data || typeof data !== 'object') return false;
  return (data as { type?: string }).type === PROBE_SURVEY_SHELL_RESULT_TYPE;
}

/** Ask active service worker to precache survey shell assets. */
export async function prefetchSurveyOfflineAssets(extraUrls: string[] = []): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg?.active) return;
  const urls = mergePrefetchUrls(extraUrls);
  reg.active.postMessage({ type: PREFETCH_MESSAGE_TYPE, urls });
}

/** Probe whether survey shell is available via service worker (online warmup). */
export async function probeSurveyShellOffline(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  const controller = navigator.serviceWorker.controller;
  if (!controller) return false;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, PROBE_SURVEY_SHELL_TIMEOUT_MS);

    const onMessage = (ev: MessageEvent) => {
      if (!isProbeSurveyShellResult(ev.data)) return;
      cleanup();
      resolve(Boolean(ev.data.ok));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    controller.postMessage({ type: PROBE_SURVEY_SHELL_TYPE });
  });
}
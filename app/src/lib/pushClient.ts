function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getVapidPublicKey(): Promise<string> {
  const res = await fetch('/api/push/vapid', { method: 'GET' });
  if (!res.ok) throw new Error('Push not configured');
  const json = (await res.json()) as { publicKey?: unknown };
  const key = typeof json.publicKey === 'string' ? json.publicKey.trim() : '';
  if (!key) throw new Error('Missing VAPID public key');
  return key;
}

export async function ensurePushRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service worker unsupported');
  }
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return await navigator.serviceWorker.register('/sw.js');
  }
}

export async function subscribePush(authToken: string): Promise<PushSubscription> {
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  if (isIOS && !isStandalone) {
    throw new Error('Install the app to enable push on iOS');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permission denied');

  const reg = await ensurePushRegistration();
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  const vapid = await getVapidPublicKey();
  const appKey = urlBase64ToUint8Array(vapid);
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
  const json = sub.toJSON() as { endpoint?: unknown; keys?: unknown };

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });

  return sub;
}

export async function unsubscribePush(authToken: string): Promise<boolean> {
  const reg = await ensurePushRegistration();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  const json = sub.toJSON() as { endpoint?: unknown };
  const endpoint = typeof json.endpoint === 'string' ? json.endpoint : '';
  try {
    await sub.unsubscribe();
  } catch {
    void 0;
  }
  if (endpoint) {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ endpoint }),
    });
  }
  return true;
}

export async function testPush(authToken: string): Promise<number> {
  const res = await fetch('/api/push/test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const json = (await res.json()) as { delivered?: unknown };
  return typeof json.delivered === 'number' ? json.delivered : 0;
}

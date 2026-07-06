import webpush from 'web-push';

type Subscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function getVapid() {
  const publicKey = String(process.env.VAPID_PUBLIC_KEY ?? '').trim();
  const privateKey = String(process.env.VAPID_PRIVATE_KEY ?? '').trim();
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  return { publicKey, privateKey };
}

export function getVapidPublicKey(): string {
  return getVapid().publicKey;
}

export async function sendWebPush(subscription: Subscription, payload: Record<string, unknown>): Promise<void> {
  const vapid = getVapid();
  webpush.setVapidDetails('mailto:no-reply@solaris-cet.com', vapid.publicKey, vapid.privateKey);
  await webpush.sendNotification(subscription as unknown as webpush.PushSubscription, JSON.stringify(payload), {
    TTL: 60,
  });
}


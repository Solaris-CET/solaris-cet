export const COMMUNITY_DIGEST_JOB_PATH = '/api/jobs/community-digest';
export const COMMUNITY_DIGEST_JOB_METHODS = 'POST, OPTIONS';

export const COMMUNITY_DIGEST_JOB_PROBE = {
  path: COMMUNITY_DIGEST_JOB_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  cronAuthRequired: true,
  lookbackDays: 7,
  topPostsLimit: 10,
  subscribersLimit: 500,
  emailNotConfiguredStatus: 501,
  emailTemplate: 'community_digest_weekly' as const,
  defaultSiteOrigin: 'https://solaris-cet.com' as const,
  forumPath: '/forum' as const,
};

export function canSendCommunityDigestEmail(): boolean {
  const provider = String(process.env.EMAIL_PROVIDER ?? '').trim().toLowerCase();
  if (provider === 'postmark') return Boolean(String(process.env.POSTMARK_SERVER_TOKEN ?? '').trim());
  return Boolean(String(process.env.RESEND_API_KEY ?? '').trim());
}

export function communityDigestSiteOrigin(): string {
  const raw = String(process.env.PUBLIC_SITE_URL ?? '').trim();
  if (raw) return raw.replace(/\/$/, '');
  return COMMUNITY_DIGEST_JOB_PROBE.defaultSiteOrigin;
}

export function renderCommunityDigestEmail(input: {
  locale: string | null;
  origin: string;
  weekFrom: string;
  weekTo: string;
  posts: { title: string; url: string; score: number }[];
}): { subject: string; html: string; text: string } {
  const subject =
    input.locale === 'en'
      ? 'Solaris CET — Community weekly digest'
      : input.locale === 'es'
        ? 'Solaris CET — Resumen semanal de la comunidad'
        : 'Solaris CET — Digest săptămânal (Comunitate)';

  const title =
    input.locale === 'en'
      ? 'Weekly community digest'
      : input.locale === 'es'
        ? 'Resumen semanal'
        : 'Digest săptămânal';

  const intro =
    input.locale === 'en'
      ? `Top posts from ${input.weekFrom} to ${input.weekTo}.`
      : input.locale === 'es'
        ? `Mejores publicaciones del ${input.weekFrom} al ${input.weekTo}.`
        : `Cele mai bune postări din perioada ${input.weekFrom} – ${input.weekTo}.`;

  const lines = input.posts
    .map(
      (p, idx) =>
        `<li style="margin:0 0 10px;"><a href="${p.url}" style="color:#e5faff;text-decoration:none;font-weight:700;">${idx + 1}. ${p.title}</a><div style="margin-top:4px;color:rgba(229,231,235,0.7);font-size:12px;">score ${p.score}</div></li>`,
    )
    .join('');

  const forumUrl = `${input.origin}${COMMUNITY_DIGEST_JOB_PROBE.forumPath}`;
  const cta = input.locale === 'en' ? 'Open forum' : input.locale === 'es' ? 'Abrir foro' : 'Deschide forum';

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#0b0f17;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:28px 18px;">
      <div style="border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);border-radius:16px;padding:22px;">
        <div style="font-weight:800;letter-spacing:-0.02em;font-size:18px;color:#f2c94c;">Solaris CET</div>
        <h1 style="margin:10px 0 0;font-size:20px;line-height:1.25;color:#ffffff;">${title}</h1>
        <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:rgba(229,231,235,0.9);">${intro}</p>
        <ol style="margin:16px 0 0;padding-left:18px;line-height:1.45;">${lines || ''}</ol>
        <div style="margin-top:18px;">
          <a href="${forumUrl}" style="display:inline-block;background:rgba(46,231,255,0.16);border:1px solid rgba(46,231,255,0.35);color:#e5faff;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">${cta}</a>
        </div>
      </div>
    </div>
  </body>
</html>`;

  const textLines = input.posts.map((p, idx) => `${idx + 1}. ${p.title} (score ${p.score})\n${p.url}`).join('\n\n');
  const text = `Solaris CET\n\n${title}\n${intro}\n\n${textLines}\n\n${forumUrl}`;
  return { subject, html, text };
}
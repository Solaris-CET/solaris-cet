import { publicOrigin } from './publicOrigin';

type VerifyEmailTemplate = {
  verifyUrl: string;
  unsubscribeUrl: string;
};

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#05060A;color:#EAEAF0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="border:1px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.35);border-radius:16px;padding:22px;">
      ${bodyHtml}
    </div>
    <div style="margin-top:14px;color:rgba(234,234,240,0.6);font-size:12px;line-height:1.45;">
      Solaris CET · <a style="color:rgba(255,220,165,0.95);text-decoration:none;" href="${publicOrigin()}">${publicOrigin()}</a>
    </div>
  </div></body></html>`;
}

export function newsletterVerifyEmail(req: Request, t: VerifyEmailTemplate): { subject: string; html: string; text: string } {
  const origin = publicOrigin(req);
  const subject = 'Confirmă abonarea la newsletter — Solaris CET';
  const html = shell(
    subject,
    `<h1 style="margin:0 0 10px;font-size:22px;letter-spacing:-0.02em;">Confirmă abonarea</h1>
     <p style="margin:0 0 16px;color:rgba(234,234,240,0.78);font-size:14px;line-height:1.55;">Apasă butonul de mai jos ca să confirmi că acest email îți aparține.</p>
     <p style="margin:0 0 18px;"><a href="${t.verifyUrl}" style="display:inline-block;padding:12px 16px;border-radius:14px;background:rgba(255,220,165,0.12);border:1px solid rgba(255,220,165,0.35);color:rgba(255,220,165,0.95);font-weight:700;text-decoration:none;">Confirmă abonarea</a></p>
     <p style="margin:0 0 6px;color:rgba(234,234,240,0.62);font-size:12px;line-height:1.55;">Dacă nu ai cerut acest email, ignoră-l.</p>
     <p style="margin:0;color:rgba(234,234,240,0.62);font-size:12px;line-height:1.55;">Dezabonare: <a href="${t.unsubscribeUrl}" style="color:rgba(234,234,240,0.85);">${t.unsubscribeUrl.replace(origin, '')}</a></p>`,
  );
  const text = `Confirmă abonarea: ${t.verifyUrl}\nDezabonare: ${t.unsubscribeUrl}`;
  return { subject, html, text };
}

export function newsletterWelcomeEmail(req: Request): { subject: string; html: string; text: string } {
  const origin = publicOrigin(req);
  const subject = 'Bine ai venit în Solaris CET';
  const html = shell(
    subject,
    `<h1 style="margin:0 0 10px;font-size:22px;letter-spacing:-0.02em;">Bine ai venit</h1>
     <p style="margin:0 0 16px;color:rgba(234,234,240,0.78);font-size:14px;line-height:1.55;">Ești abonat(ă). Urmează 3 emailuri scurte de onboarding cu cele mai utile link-uri și setări.</p>
     <p style="margin:0;"><a href="${origin}/app" style="display:inline-block;padding:12px 16px;border-radius:14px;background:rgba(255,220,165,0.12);border:1px solid rgba(255,220,165,0.35);color:rgba(255,220,165,0.95);font-weight:700;text-decoration:none;">Deschide App</a></p>`,
  );
  const text = `Bine ai venit. Deschide App: ${origin}/app`;
  return { subject, html, text };
}

export function onboardingEmail(req: Request, step: 1 | 2 | 3): { subject: string; html: string; text: string } {
  const origin = publicOrigin(req);
  const subject =
    step === 1
      ? 'Onboarding 1/3: Setează alerte de preț CET'
      : step === 2
        ? 'Onboarding 2/3: Activează notificările push'
        : 'Onboarding 3/3: Explorează staking / governance';
  const body =
    step === 1
      ? `<h1 style="margin:0 0 10px;font-size:20px;letter-spacing:-0.02em;">Setează o alertă de preț</h1>
         <p style="margin:0 0 14px;color:rgba(234,234,240,0.78);font-size:14px;line-height:1.55;">Primești un email când $CET trece peste sau sub un prag ales de tine.</p>
         <p style="margin:0;"><a href="${origin}/app" style="display:inline-block;padding:12px 16px;border-radius:14px;background:rgba(46,231,255,0.10);border:1px solid rgba(46,231,255,0.28);color:rgba(46,231,255,0.95);font-weight:700;text-decoration:none;">Configurează alerte</a></p>`
      : step === 2
        ? `<h1 style="margin:0 0 10px;font-size:20px;letter-spacing:-0.02em;">Activează push</h1>
           <p style="margin:0 0 14px;color:rgba(234,234,240,0.78);font-size:14px;line-height:1.55;">Push-ul din browser e cel mai rapid canal pentru statusuri și alerte.</p>
           <p style="margin:0;"><a href="${origin}/app" style="display:inline-block;padding:12px 16px;border-radius:14px;background:rgba(255,220,165,0.12);border:1px solid rgba(255,220,165,0.35);color:rgba(255,220,165,0.95);font-weight:700;text-decoration:none;">Activează push</a></p>`
        : `<h1 style="margin:0 0 10px;font-size:20px;letter-spacing:-0.02em;">Explorează modulele Web3</h1>
           <p style="margin:0 0 14px;color:rgba(234,234,240,0.78);font-size:14px;line-height:1.55;">Staking, governance și bridge sunt organizate în App ca să poți urmări statusurile.</p>
           <p style="margin:0;"><a href="${origin}/app" style="display:inline-block;padding:12px 16px;border-radius:14px;background:rgba(46,231,255,0.10);border:1px solid rgba(46,231,255,0.28);color:rgba(46,231,255,0.95);font-weight:700;text-decoration:none;">Deschide Web3</a></p>`;
  const html = shell(subject, body);
  const text = `${subject}\n${origin}/app`;
  return { subject, html, text };
}

export function priceAlertEmail(req: Request, input: { direction: 'above' | 'below'; targetUsd: string; priceUsd: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const origin = publicOrigin(req);
  const arrow = input.direction === 'above' ? '↑' : '↓';
  const subject = `Alertă $CET ${arrow} $${input.targetUsd}`;
  const html = shell(
    subject,
    `<h1 style="margin:0 0 10px;font-size:20px;letter-spacing:-0.02em;">Alertă preț $CET</h1>
     <p style="margin:0 0 14px;color:rgba(234,234,240,0.78);font-size:14px;line-height:1.55;">$CET este acum la <strong style="color:rgba(255,220,165,0.95);">$${input.priceUsd}</strong> și a trecut ${input.direction === 'above' ? 'peste' : 'sub'} pragul tău de <strong>$${input.targetUsd}</strong>.</p>
     <p style="margin:0;"><a href="${origin}/app" style="display:inline-block;padding:12px 16px;border-radius:14px;background:rgba(255,220,165,0.12);border:1px solid rgba(255,220,165,0.35);color:rgba(255,220,165,0.95);font-weight:700;text-decoration:none;">Gestionează alertele</a></p>`,
  );
  const text = `$CET este acum la $${input.priceUsd} și a trecut ${input.direction === 'above' ? 'peste' : 'sub'} pragul $${input.targetUsd}.`;
  return { subject, html, text };
}


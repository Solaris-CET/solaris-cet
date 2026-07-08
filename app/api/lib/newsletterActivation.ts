import { getDb, schema } from '@/db/client';
import { newsletterWelcomeEmail, onboardingEmail } from './emailTemplates';

export async function queueNewsletterActivationEmails(req: Request, email: string): Promise<void> {
  const db = getDb();
  const welcome = newsletterWelcomeEmail(req);
  await db.insert(schema.emailOutbox).values({
    toEmail: email,
    template: 'newsletter_welcome',
    subject: welcome.subject,
    html: welcome.html,
    textBody: welcome.text,
    sendAfter: new Date(Date.now() + 15_000),
  });

  const s1 = onboardingEmail(req, 1);
  const s2 = onboardingEmail(req, 2);
  const s3 = onboardingEmail(req, 3);
  await db.insert(schema.emailOutbox).values([
    {
      toEmail: email,
      template: 'onboarding_1',
      subject: s1.subject,
      html: s1.html,
      textBody: s1.text,
      sendAfter: new Date(Date.now() + 60 * 60 * 1000),
    },
    {
      toEmail: email,
      template: 'onboarding_2',
      subject: s2.subject,
      html: s2.html,
      textBody: s2.text,
      sendAfter: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
    {
      toEmail: email,
      template: 'onboarding_3',
      subject: s3.subject,
      html: s3.html,
      textBody: s3.text,
      sendAfter: new Date(Date.now() + 96 * 60 * 60 * 1000),
    },
  ]);
}
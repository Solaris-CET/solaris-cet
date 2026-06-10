import { expect, test } from '@playwright/test';

test.describe('Public assets', () => {
  test('robots.txt is present and references sitemap.xml', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('Sitemap: https://solaris-cet.com/sitemap.xml');
  });

  test('sitemap.xml is present and includes company service routes', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('https://solaris-cet.com/servicii');
    expect(body).toContain('https://solaris-cet.com/contact');
    expect(body).toContain('https://solaris-cet.com/servicii/fotovoltaice-rezidentiale');
    expect(body).not.toContain('https://solaris-cet.com/en/');
  });

  test('contact page is served', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Contact Solaris/i)).toBeVisible({ timeout: 15000 });
  });
});

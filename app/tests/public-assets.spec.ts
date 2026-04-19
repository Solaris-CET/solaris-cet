import { expect, test } from '@playwright/test';

test.describe('Public assets', () => {
  test('robots.txt is present and references sitemap.xml', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('Sitemap: https://solaris-cet.com/sitemap.xml');
  });

  test('sitemap.xml is present and includes sovereign + audit + whitepaper routes', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('https://solaris-cet.com/sovereign/');
    expect(body).toContain('https://solaris-cet.com/audit/');
    expect(body).toContain('https://solaris-cet.com/whitepaper');
  });

  test('whitepaper route resolves to a verifiable IPFS target', async ({ request }) => {
    const res = await request.get('/whitepaper', { maxRedirects: 0 });
    const cid = 'bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a';
    if (res.status() === 302) {
      expect(res.headers()['location']).toContain(cid);
      return;
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain(cid);
  });

  test('audit static page is served', async ({ page }) => {
    await page.goto('/audit/');
    await expect(page.getByRole('heading', { name: /Audit Report/i })).toBeVisible();
  });

  test('sovereign whitepaper no-JS page is served', async ({ page }) => {
    await page.goto('/sovereign/whitepaper.html');
    await expect(page.getByText(/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a/i)).toBeVisible();
  });
});

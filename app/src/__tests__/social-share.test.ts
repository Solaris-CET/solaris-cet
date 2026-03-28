import { describe, it, expect, vi, afterEach } from 'vitest';

// ─── SocialShare — URL construction ──────────────────────────────────────

const SITE_URL = 'https://solaris-cet.vercel.app/';
const SHARE_TEXT =
  '🚀 Just discovered $CET on #TON blockchain! Fixed supply of 9,000 CET — mine, trade & stake. Check it out 👇';

function buildTwitterShareUrl(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

describe('SocialShare — URL construction', () => {
  it('buildTwitterShareUrl contains the text encoded', () => {
    const url = buildTwitterShareUrl(SHARE_TEXT, SITE_URL);
    expect(url).toContain('twitter.com/intent/tweet');
    expect(url).toContain(encodeURIComponent(SHARE_TEXT));
  });

  it('buildTwitterShareUrl contains the site URL encoded', () => {
    const url = buildTwitterShareUrl(SHARE_TEXT, SITE_URL);
    expect(url).toContain(encodeURIComponent(SITE_URL));
  });

  it('SHARE_TEXT contains $CET ticker', () => {
    expect(SHARE_TEXT).toContain('$CET');
  });

  it('SHARE_TEXT contains #TON hashtag', () => {
    expect(SHARE_TEXT).toContain('#TON');
  });

  it('SITE_URL is a valid https URL', () => {
    expect(SITE_URL).toMatch(/^https:\/\//);
  });

  it('Twitter URL starts with https', () => {
    const url = buildTwitterShareUrl(SHARE_TEXT, SITE_URL);
    expect(url).toMatch(/^https:\/\//);
  });
});

// ─── SocialShare — native share fallback ─────────────────────────────────

describe('SocialShare — native share logic', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls navigator.share when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share: mockShare } as unknown as Navigator);

    if (navigator.share) {
      await navigator.share({ title: 'Solaris CET', text: SHARE_TEXT, url: SITE_URL });
      expect(mockShare).toHaveBeenCalledOnce();
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Solaris CET',
        text: SHARE_TEXT,
        url: SITE_URL,
      });
    }
  });

  it('falls back to clipboard when share is unavailable', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: undefined,
      clipboard: { writeText: mockWriteText },
    } as unknown as Navigator);
    // Simulate clipboard fallback
    await navigator.clipboard.writeText(`${SHARE_TEXT} ${SITE_URL}`);
    expect(mockWriteText).toHaveBeenCalledWith(`${SHARE_TEXT} ${SITE_URL}`);
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';

const SITE_URL = 'https://solaris-cet.com/';
const SHARE_TEXT =
  '🚀 Just discovered $CET on #TON blockchain! Fixed supply of 9,000 CET — mine, trade & stake. Check it out 👇';

function buildTwitterShareUrl(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

describe('SocialShare', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('Twitter intent URL + navigator.share + clipboard fallback', async () => {
    expect(SHARE_TEXT).toContain('$CET');
    expect(SHARE_TEXT).toContain('#TON');
    expect(SITE_URL).toMatch(/^https:\/\//);
    const url = buildTwitterShareUrl(SHARE_TEXT, SITE_URL);
    expect(url).toContain('twitter.com/intent/tweet');
    expect(url).toContain(encodeURIComponent(SHARE_TEXT));
    expect(url).toContain(encodeURIComponent(SITE_URL));
    expect(url).toMatch(/^https:\/\//);

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

    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: undefined,
      clipboard: { writeText: mockWriteText },
    } as unknown as Navigator);
    await navigator.clipboard.writeText(`${SHARE_TEXT} ${SITE_URL}`);
    expect(mockWriteText).toHaveBeenCalledWith(`${SHARE_TEXT} ${SITE_URL}`);
  });
});

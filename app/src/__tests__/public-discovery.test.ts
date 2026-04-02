import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const publicDir = path.resolve(__dirname, '../../public');

describe('Public discovery — sitemap & security.txt', () => {
  it('sitemap lists apocalypse static surface', () => {
    const xml = readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
    expect(xml).toContain('https://solaris-cet.com/apocalypse/');
    expect(xml).toContain('https://solaris-cet.com/sovereign/');
  });

  it('security.txt exists (RFC 9116) with Telegram contact', () => {
    const p = path.join(publicDir, '.well-known/security.txt');
    expect(existsSync(p), 'public/.well-known/security.txt must ship').toBe(true);
    const body = readFileSync(p, 'utf8');
    expect(body).toMatch(/Contact:\s*https:\/\/t\.me\/SolarisCET/);
    expect(body).toContain('Preferred-Languages:');
    expect(body).toMatch(/^Expires:\s/m);
  });

  it('humans.txt lists canonical project URLs', () => {
    const p = path.join(publicDir, 'humans.txt');
    expect(existsSync(p), 'public/humans.txt must ship').toBe(true);
    const body = readFileSync(p, 'utf8');
    expect(body).toContain('https://solaris-cet.com/');
    expect(body).toContain('github.com/Solaris-CET');
  });
});

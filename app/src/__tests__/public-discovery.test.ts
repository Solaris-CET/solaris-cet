import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const publicDir = path.resolve(__dirname, '../../public');

describe('Public discovery — sitemap, security.txt, humans.txt', () => {
  it('static assets ship with expected content', () => {
    const xml = readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
    expect(xml).toContain('https://solaris-cet.com/apocalypse/');
    expect(xml).toContain('https://solaris-cet.com/sovereign/');

    const sec = path.join(publicDir, '.well-known/security.txt');
    expect(existsSync(sec), 'public/.well-known/security.txt must ship').toBe(true);
    const secBody = readFileSync(sec, 'utf8');
    expect(secBody).toMatch(/Contact:\s*https:\/\/t\.me\/SolarisCET/);
    expect(secBody).toContain('Preferred-Languages:');
    expect(secBody).toMatch(/^Expires:\s/m);

    const hum = path.join(publicDir, 'humans.txt');
    expect(existsSync(hum), 'public/humans.txt must ship').toBe(true);
    const humBody = readFileSync(hum, 'utf8');
    expect(humBody).toContain('https://solaris-cet.com/');
    expect(humBody).toContain('github.com/Solaris-CET');
    expect(humBody).toContain('#competition');
    expect(humBody).toContain('/llms.txt');

    const llms = readFileSync(path.join(publicDir, 'llms.txt'), 'utf8');
    expect(llms).toContain('https://solaris-cet.com/');
    expect(llms).toContain('9,000 CET');
    expect(llms).toContain('Cetățuia');
    expect(llms).toContain('dedust.io');
  });
});

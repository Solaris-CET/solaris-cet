import { existsSync,readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect,it } from 'vitest';

import { PRODUCTION_SITE_ORIGIN } from '@/lib/brandAssetFilenames';

const publicDir = path.resolve(__dirname, '../../public');
const SITE = `${PRODUCTION_SITE_ORIGIN}/`;

describe('Public discovery — sitemap, security.txt, humans.txt', () => {
  it('static assets ship with expected content', () => {
    const robots = readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');
    expect(robots).toContain(`Sitemap: ${PRODUCTION_SITE_ORIGIN}/sitemap.xml`);
    expect(robots).toContain('llms.txt');

    const xml = readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
    expect(xml).toContain(`${PRODUCTION_SITE_ORIGIN}/en/servicii`);
    expect(xml).toContain(`${PRODUCTION_SITE_ORIGIN}/en/contact`);
    expect(xml).toContain(`${PRODUCTION_SITE_ORIGIN}/en/token-cet`);
    expect(xml).toContain(`${PRODUCTION_SITE_ORIGIN}/llms.txt`);
    expect(xml).toContain(`${PRODUCTION_SITE_ORIGIN}/humans.txt`);
    expect(xml).toContain(`${PRODUCTION_SITE_ORIGIN}/.well-known/security.txt`);

    const sec = path.join(publicDir, '.well-known/security.txt');
    expect(existsSync(sec), 'public/.well-known/security.txt must ship').toBe(true);
    const secBody = readFileSync(sec, 'utf8');
    expect(secBody).toMatch(/Contact:\s*mailto:solaris-cet@protonmail\.com/);
    expect(secBody).toContain('Preferred-Languages:');
    expect(secBody).toMatch(/^Expires:\s/m);

    const hum = path.join(publicDir, 'humans.txt');
    expect(existsSync(hum), 'public/humans.txt must ship').toBe(true);
    const humBody = readFileSync(hum, 'utf8');
    expect(humBody).toContain(SITE);
    expect(humBody).toContain('github.com/Solaris-CET');
    expect(humBody).toContain('STARTUPSOLARCOMPANY');
    expect(humBody).toContain('/llms.txt');

    const llms = readFileSync(path.join(publicDir, 'llms.txt'), 'utf8');
    expect(llms).toContain(SITE);
    expect(llms).toContain('Photovoltaic');
    expect(llms).toContain('+40 769 889 721');
    expect(llms).toContain('solaris-cet@protonmail.com');
  });
});

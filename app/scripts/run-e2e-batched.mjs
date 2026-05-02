import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const BASE_PORT = 4173;
const MAX_PORT = 4193;

function getPlaywrightBin() {
  return process.platform === 'win32' ? '../node_modules/.bin/playwright.cmd' : '../node_modules/.bin/playwright';
}

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function isHttpReady(host, port) {
  try {
    const base = `http://${host}:${port}`;
    const res = await fetch(`${base}/`, { method: 'GET' });
    if (!res.ok) return false;
    const html = await res.text();

    const match = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/i);
    if (!match?.[1]) return false;
    const src = match[1].startsWith('http')
      ? match[1]
      : match[1].startsWith('/')
          ? `${base}${match[1]}`
          : `${base}/${match[1]}`;
    const js = await fetch(src, { method: 'GET' });
    return js.ok;
  } catch {
    return false;
  }
}

async function waitForServer(host, port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isHttpReady(host, port)) return true;
    await delay(250);
  }
  return false;
}

async function pickPort(startPort = BASE_PORT) {
  for (let port = startPort; port < MAX_PORT; port += 1) {
    if (!(await isPortOpen(HOST, port))) return port;
  }
  for (let port = BASE_PORT; port < startPort; port += 1) {
    if (!(await isPortOpen(HOST, port))) return port;
  }
  return startPort;
}

async function waitForPortClosed(host, port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!(await isPortOpen(host, port))) return true;
    await delay(250);
  }
  return false;
}

async function waitForDistIndex(timeoutMs) {
  const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const distIndexPath = path.join(appRoot, 'dist', 'index.html');
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await access(distIndexPath);
      return true;
    } catch {
      await delay(200);
    }
  }
  return false;
}

function startServer(port) {
  const env = {
    ...process.env,
    HOST,
    PORT: String(port),
    LOG_LEVEL: process.env.LOG_LEVEL || 'error',
    NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=1024'].filter(Boolean).join(' '),
  };
  return spawn(process.execPath, ['server/index.cjs'], {
    cwd: new URL('../', import.meta.url).pathname,
    env,
    stdio: 'inherit',
  });
}

async function stopServer(proc, port) {
  if (!proc || proc.killed) return;
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        void 0;
      }
      resolve();
    }, 2000);

    proc.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });

    try {
      proc.kill('SIGTERM');
    } catch {
      clearTimeout(timer);
      resolve();
    }
  });
  await waitForPortClosed(HOST, port, 5000);
}

async function runPlaywright(files, extraArgs, baseUrl) {
  const bin = getPlaywrightBin();
  const args = ['test', '--workers=1', ...files, ...extraArgs];
  const child = spawn(bin, args, { stdio: 'inherit', env: { ...process.env, E2E_BASE_URL: baseUrl } });
  return await new Promise((resolve) => {
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

const cliArgs = process.argv.slice(2);
const cliFiles = cliArgs.filter((a) => a.endsWith('.spec.ts') || a.endsWith('.spec.tsx'));
const cliExtra = cliArgs.filter((a) => !cliFiles.includes(a));

const defaultBatches = [
  ['tests/public-assets.spec.ts'],
  ['tests/pwa-offline.spec.ts'],
  ['tests/sovereign-static.spec.ts'],
  ['tests/a11y-axe.spec.ts'],
  ['tests/header-trust-strip.spec.ts'],
  ['tests/navigation-primary.spec.ts'],
  ['tests/navigation-mobile.spec.ts'],
  ['tests/domain-pillars.spec.ts'],
  ['tests/conversion-ui.spec.ts'],
  ['tests/competition-section.spec.ts'],
  ['tests/security-section.spec.ts'],
  ['tests/mermaid-decision-map.spec.ts'],
  ['tests/ai-model.spec.ts'],
  ['tests/cet-ai-widget.spec.ts'],
  ['tests/telegram-miniapp.spec.ts'],
  ['tests/wallet.spec.ts'],
];

const batches = cliFiles.length ? [cliFiles] : defaultBatches;

let lastExitCode = 0;
let nextPort = BASE_PORT;

for (const files of batches) {
  const port = await pickPort(nextPort);
  nextPort = port + 1;
  const distOk = await waitForDistIndex(60_000);
  if (!distOk) {
    lastExitCode = 1;
    break;
  }
  const server = startServer(port);
  const ready = await waitForServer(HOST, port, 60_000);
  if (!ready) {
    await stopServer(server, port);
    lastExitCode = 1;
    break;
  }

  const code = await runPlaywright(files, cliExtra, `http://${HOST}:${port}`);
  await stopServer(server, port);

  if (code !== 0) {
    lastExitCode = code;
    break;
  }
}

process.exit(lastExitCode);

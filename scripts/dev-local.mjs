#!/usr/bin/env node
/**
 * Start local dev stack (survey :8000 + Node API :3000 + Vite :5173).
 * Usage: npm run dev:local
 *        npm run dev:local -- --skip-build
 * Ctrl+C stops all child processes.
 */
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = join(root, 'app');
const surveyDir = join(root, 'survey-engine');
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';
const skipBuild = process.argv.includes('--skip-build');

const children = [];
let shuttingDown = false;

const LABEL = {
  survey: '\x1b[36m[survey]\x1b[0m',
  api: '\x1b[33m[api]\x1b[0m',
  vite: '\x1b[32m[vite]\x1b[0m',
};

function pipeLines(stream, label) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) console.log(`${label} ${line}`);
    }
  });
  stream.on('end', () => {
    if (buffer.trim()) console.log(`${label} ${buffer}`);
  });
}

function start(name, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? root,
    env: { ...process.env, ...options.env },
    shell: isWin,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  pipeLines(child.stdout, LABEL[name]);
  pipeLines(child.stderr, LABEL[name]);

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    const why = signal ? `signal ${signal}` : `code ${code ?? 1}`;
    console.error(`\n${LABEL[name]} exited (${why})`);
    shutdown(code ?? 1);
  });

  children.push({ name, child });
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\nStopping local stack…');
  for (const { child } of children) {
    if (!child.killed) {
      if (isWin) spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { shell: true, windowsHide: true });
      else child.kill('SIGTERM');
    }
  }
  setTimeout(() => process.exit(code), 500);
}

async function waitForUrl(url, label, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        console.log(`✓ ${label} ready → ${url}`);
        return true;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.warn(`⚠ ${label} not responding yet → ${url}`);
  return false;
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function portBusy(port) {
  return new Promise((resolveBusy) => {
    const server = net.createServer();
    server.once('error', () => resolveBusy(true));
    server.once('listening', () => {
      server.close(() => resolveBusy(false));
    });
    server.listen(port, '127.0.0.1');
  });
}

console.log('Solaris CET — local dev stack\n');

const busy = (
  await Promise.all([
    portBusy(8000).then((b) => (b ? 8000 : null)),
    portBusy(3000).then((b) => (b ? 3000 : null)),
    portBusy(5173).then((b) => (b ? 5173 : null)),
  ])
).filter(Boolean);

if (busy.length > 0) {
  console.error(`Ports already in use: ${busy.join(', ')}`);
  console.error('Stop existing dev servers, then run: npm run dev:local');
  process.exit(1);
}

if (!skipBuild) {
  console.log('Building API routes (app/.api-dist)…');
  const build = spawnSync(npm, ['run', 'api:build', '--workspace=app'], {
    cwd: root,
    shell: isWin,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (build.status !== 0) process.exit(build.status ?? 1);
} else {
  console.log('Skipping api:build (--skip-build)');
}

console.log('\nStarting services…\n');

start('survey', 'python', ['-m', 'uvicorn', 'src.server:app', '--reload', '--port', '8000'], {
  cwd: surveyDir,
});

start('api', 'node', ['server/index.cjs'], {
  cwd: appDir,
  env: { SURVEY_ENGINE_URL: 'http://127.0.0.1:8000' },
});

start('vite', npm, ['run', 'dev'], {
  cwd: appDir,
});

console.log('Waiting for health checks…\n');

await Promise.all([
  waitForUrl('http://127.0.0.1:8000/health', 'Survey engine'),
  waitForUrl('http://127.0.0.1:3000/api/survey/health', 'Node API'),
  waitForUrl('http://127.0.0.1:5173/', 'Vite frontend'),
]);

console.log(`
Local URLs:
  Frontend   http://localhost:5173/
  Survey UI  http://localhost:5173/survey
  API health http://localhost:5173/api/survey/health

Press Ctrl+C to stop all services.
`);
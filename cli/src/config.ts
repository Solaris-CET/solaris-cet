import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export type CliConfig = {
  baseUrl?: string;
  adminToken?: string;
};

function defaultConfigPath(): string {
  const fromEnv = String(process.env.SOLARIS_CLI_CONFIG ?? '').trim();
  if (fromEnv) return fromEnv;
  const home = os.homedir();
  const xdg = String(process.env.XDG_CONFIG_HOME ?? '').trim();
  const base = xdg || path.join(home, '.config');
  return path.join(base, 'solaris-cli', 'config.json');
}

export async function readConfig(): Promise<{ path: string; config: CliConfig }> {
  const p = defaultConfigPath();
  try {
    const raw = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') return { path: p, config: parsed as CliConfig };
  } catch {
    void 0;
  }
  return { path: p, config: {} };
}

export async function writeConfig(p: string, config: CliConfig): Promise<void> {
  await fs.mkdir(path.dirname(p), { recursive: true });
  const out = JSON.stringify(config, null, 2);
  await fs.writeFile(p, out + '\n', 'utf8');
}


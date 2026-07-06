import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_COUNT = 5000;

function pad(n, len = 4) {
  return String(n).padStart(len, '0');
}

function stablePick(arr, i) {
  return arr[i % arr.length];
}

function ruleTemplate(i) {
  const categories = ['security', 'api', 'seo', 'cwv', 'testing', 'deploy', 'monorepo', 'ux', 'content', 'observability'];
  const cat = stablePick(categories, i);
  const severity = cat === 'security' ? 'critical' : cat === 'deploy' ? 'high' : 'medium';
  const id = `R${pad(i)}`;
  const title = `${id} ${cat.toUpperCase()} guardrail`;

  const checks = [];
  const commands = [];

  if (cat === 'seo') {
    checks.push('HTML-first content (no-JS) for public pages');
    commands.push('curl -A "Googlebot" https://solaris-cet.com/ | grep -i "fotovoltaic"');
  }
  if (cat === 'cwv') {
    checks.push('LCP/CLS/INP within budgets');
    commands.push('cd /root/solaris-cet && npm run lighthouse:audit');
  }
  if (cat === 'testing') {
    checks.push('Deterministic tests pass');
    commands.push('cd /root/solaris-cet && npm run verify:fast');
    commands.push('cd /root/solaris-cet && npm run verify:all');
  }
  if (cat === 'deploy') {
    checks.push('No secrets in build args; stable Coolify build');
    commands.push('curl -sSI https://solaris-cet.com/health.json | head');
  }
  if (cat === 'api') {
    checks.push('CORS + rate limit + validation + safe degrade');
    commands.push('cd /root/solaris-cet && npm --workspace=app run typecheck');
  }
  if (cat === 'monorepo') {
    checks.push('Workspace scripts are explicit and correct');
    commands.push('cd /root/solaris-cet && npm -ws run typecheck');
  }
  if (cat === 'security') {
    checks.push('No secrets/PII in logs; runtime secrets only');
    commands.push('cd /root/solaris-cet && npm run verify:fast');
  }

  return {
    id,
    category: cat,
    severity,
    title,
    description:
      'High-signal guardrail. Generated catalog entry; treat as policy-level requirement for consistent, safe, high-output delivery.',
    checks,
    commands,
  };
}

function skillTemplate(i) {
  const id = `S${pad(i)}`;
  const triggers = [
    'multi-file refactor',
    'SEO/public page changes',
    'API route changes',
    'deploy failures',
    'test regressions',
    'performance regressions',
    'monorepo script drift',
  ];
  const trigger = stablePick(triggers, i);
  return {
    name: `skillpack-${id}`,
    description: `Generated skill definition. Invoke when: ${trigger}.`,
    invokeWhen: trigger,
    gates: [
      'cd /root/solaris-cet && npm run verify:fast',
      'cd /root/solaris-cet && npm run verify:all',
    ],
  };
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const countArg = process.argv.find((a) => a.startsWith('--count='));
  const count = countArg ? Math.max(1, Number(countArg.split('=')[1] ?? DEFAULT_COUNT)) : DEFAULT_COUNT;

  const repoRoot = process.cwd();
  const outDir = path.join(repoRoot, 'docs', 'agent-catalog');
  const rulesPath = path.join(outDir, `rules.${count}.json`);
  const skillsPath = path.join(outDir, `skills.${count}.json`);

  const rules = [];
  const skills = [];
  for (let i = 1; i <= count; i++) {
    rules.push(ruleTemplate(i));
    skills.push(skillTemplate(i));
  }

  await writeJson(rulesPath, { generatedAt: new Date().toISOString(), count, rules });
  await writeJson(skillsPath, { generatedAt: new Date().toISOString(), count, skills });

  const readmePath = path.join(outDir, 'README.md');
  const readme = [
    '# Agent Catalog',
    '',
    `- rules.${count}.json: ${count} generated rule entries`,
    `- skills.${count}.json: ${count} generated skill definitions (catalog form)`,
    '',
    'Note: The catalog is the scalable representation. Materializing thousands of `.trae/skills/*` directories is intentionally avoided because it degrades repo performance.',
    '',
  ].join('\n');
  await fs.writeFile(readmePath, readme, 'utf8');

  if (args.has('--materialize')) {
    const nArg = process.argv.find((a) => a.startsWith('--materialize='));
    const n = nArg ? Math.max(1, Number(nArg.split('=')[1] ?? 50)) : 50;
    const force = args.has('--force');
    if (n > 200 && !force) {
      throw new Error('Refusing to materialize >200 skills without --force. Use catalog JSON instead.');
    }
    for (let i = 1; i <= n; i++) {
      const sid = `S${pad(i)}`;
      const dir = path.join(repoRoot, '.trae', 'skills', `skillpack-${sid}`);
      await fs.mkdir(dir, { recursive: true });
      const md =
        `---\nname: \"skillpack-${sid}\"\ndescription: \"Generated micro-skill. Invoke when you need the specific playbook for ${skillTemplate(i).invokeWhen}.\"\n---\n\n` +
        `# Skillpack ${sid}\n\n` +
        `Invoke when: ${skillTemplate(i).invokeWhen}\n\n` +
        `## Gates\n\n` +
        '```bash\n' +
        'cd /root/solaris-cet && npm run verify:fast\n' +
        'cd /root/solaris-cet && npm run verify:all\n' +
        '```\n';
      await fs.writeFile(path.join(dir, 'SKILL.md'), md, 'utf8');
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


import fs from 'node:fs/promises';
import path from 'node:path';

function skillFrontmatter({ name, description }) {
  return `---\nname: "${name}"\ndescription: "${description}"\n---\n\n`;
}

function skillBody({ title, sections }) {
  const lines = [`# ${title}`, ''];
  for (const s of sections) {
    lines.push(`## ${s.title}`, '', ...s.lines, '');
  }
  return lines.join('\n');
}

function makeSkill({ name, description, title, sections }) {
  return skillFrontmatter({ name, description }) + skillBody({ title, sections });
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeSkill(rootDir, skillName, md) {
  const dir = path.join(rootDir, '.trae', 'skills', skillName);
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, 'SKILL.md'), md, 'utf8');
}

async function main() {
  const repoRoot = process.cwd();
  const out = [];

  const base = [
    {
      name: 'solaris-meta-orchestrator',
      description: 'Runs end-to-end delivery with safety gates (repo search→implement→verify→deploy checks). Invoke for big batches spanning SEO+API+UI+deploy.',
      title: 'Solaris Meta Orchestrator',
      sections: [
        { title: 'Gates', lines: ['- verify:fast', '- verify:all', '- lighthouse:audit', '- curl Googlebot grep'] },
        { title: 'Safety', lines: ['- no secrets/PII logs', '- runtime env only', '- API guardrails'] },
      ],
    },
  ];

  for (const s of base) {
    const md = makeSkill(s);
    out.push({ skill: s.name, bytes: Buffer.byteLength(md) });
    await writeSkill(repoRoot, s.name, md);
  }

  const summaryPath = path.join(repoRoot, 'docs', 'skillpack.generated.json');
  await ensureDir(path.dirname(summaryPath));
  await fs.writeFile(summaryPath, JSON.stringify({ generatedAt: new Date().toISOString(), out }, null, 2), 'utf8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


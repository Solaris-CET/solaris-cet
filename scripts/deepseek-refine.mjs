#!/usr/bin/env node
/**
 * Loop 4 — DeepSeek V4 Pro document refinement.
 * Usage: npm run loops:refine -- docs/planning/GO-TO-MARKET-STRATEGY.md "Add pricing tiers"
 *        node scripts/deepseek-refine.mjs <file> "<instruction>"
 *
 * Env: DEEPSEEK_API_KEY or DEEPSEEK_CHATBOT_API_KEY
 * Without key: prints manual refinement checklist (graceful degrade).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fileArg = process.argv[2];
const instruction = process.argv.slice(3).join(' ').trim();

if (!fileArg || !instruction) {
  console.error('Usage: node scripts/deepseek-refine.mjs <file> "<instruction>"');
  process.exit(1);
}

const filePath = resolve(root, fileArg);
if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_CHATBOT_API_KEY || '';
const content = readFileSync(filePath, 'utf8');

const systemPrompt = `You are a GTM strategist for SOLARIS CET (solar kits B2C Romania + AI field survey B2B).
Refine the document per instruction. Keep markdown structure, add measurable KPIs, RO market context.
Output ONLY the full refined markdown — no preamble.`;

if (!apiKey) {
  console.log('═══ DeepSeek refine — manual mode (no API key) ═══\n');
  console.log(`File: ${fileArg}`);
  console.log(`Instruction: ${instruction}\n`);
  console.log('Checklist for human/agent loop:');
  console.log('  1. Read current doc section-by-section');
  console.log('  2. Apply instruction surgically (do not delete unrelated content)');
  console.log('  3. Add KPIs with numeric targets where missing');
  console.log('  4. Cross-check CONSULTING-SOLUTIONS.md positioning');
  console.log('  5. Run: npm run stash:sync');
  console.log('\nSet DEEPSEEK_API_KEY to enable API refinement.');
  process.exit(0);
}

const body = {
  model: 'deepseek-chat',
  messages: [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `## Instruction\n${instruction}\n\n## Current document\n${content.slice(0, 120_000)}`,
    },
  ],
  temperature: 0.4,
  max_tokens: 8192,
};

console.log(`Refining ${fileArg} via DeepSeek…`);

const res = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(120_000),
});

if (!res.ok) {
  const err = await res.text().catch(() => '');
  console.error(`DeepSeek API error ${res.status}: ${err.slice(0, 400)}`);
  process.exit(1);
}

const json = await res.json();
const refined = json?.choices?.[0]?.message?.content?.trim();
if (!refined || refined.length < 200) {
  console.error('DeepSeek returned empty or too-short response');
  process.exit(1);
}

writeFileSync(filePath, refined.endsWith('\n') ? refined : `${refined}\n`, 'utf8');
console.log(`✓ Wrote ${refined.length} chars to ${fileArg}`);
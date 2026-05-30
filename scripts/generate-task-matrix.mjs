import fs from 'node:fs';
import path from 'node:path';

const AREAS = [
  'A1 Performance', 'A2 SEO', 'A3 Accessibility', 'A4 Content & i18n',
  'A5 Conversion', 'A6 PWA', 'A7 API reliability', 'A8 Observability',
  'A9 Security hardening', 'A10 Coolify/Docker reliability',
  'A11 Testing quality', 'A12 Repo hygiene'
];

const TARGETS = [
  'P1 Home', 'P2 Services', 'P3 Products', 'P4 Contact', 'P5 Token CET',
  'P6 About', 'P7 FAQ', 'P8 Legal', 'P9 Nav/Footer', 'P10 Chat widget',
  'O1 Dockerfile', 'O2 docker/coolify.yml', 'O3 scripts/post-deploy.mjs',
  'O4 scripts/smoke-http.mjs', 'O5 health.json', 'O6 /metrics', 'O7 GitHub workflows'
];

const ACTIONS = ['X1 Add', 'X2 Improve', 'X3 Remove', 'X4 Refactor', 'X5 Secure', 'X6 Verify', 'X7 Document'];

const LOCALES = ['ro', 'en', 'de', 'es', 'pt'];
const DEVICES = ['mobile', 'desktop'];
const SCENARIOS = ['new_user', 'returning_user', 'slow_3g', 'low_end_cpu'];

function generateTasks() {
  const tasks = [];
  let taskId = 1;

  for (let k = 1; k <= 250; k++) {
    // Deterministic selection of Area, Target, Action for template K
    const area = AREAS[(k - 1) % AREAS.length];
    const target = TARGETS[(k - 1) % TARGETS.length];
    const action = ACTIONS[(k - 1) % ACTIONS.length];

    // Generate 40 variants for this template
    for (const locale of LOCALES) {
      for (const device of DEVICES) {
        for (const scenario of SCENARIOS) {
          const tId = `T-${String(taskId).padStart(5, '0')}`;
          tasks.push({
            id: tId,
            templateId: `TEMPLATE-${String(k).padStart(3, '0')}`,
            area,
            target,
            action,
            variant: { locale, device, scenario },
            goal: `Improve ${target} in ${area} for ${locale} on ${device} (${scenario})`,
            acceptance: `Verified on ${device} with ${locale} locale under ${scenario} conditions.`
          });
          taskId++;
        }
      }
    }
  }

  return tasks;
}

const allTasks = generateTasks();
fs.writeFileSync('TASKS_MATRIX.json', JSON.stringify(allTasks, null, 2));
console.log(`Generated ${allTasks.length} tasks in TASKS_MATRIX.json`);

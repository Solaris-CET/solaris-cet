// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('twin-agent routes', () => {
  it('plan route proxies to engine', () => {
    const libPath = join(process.cwd(), 'api', 'lib', 'surveyTwinAgent.ts');
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-agent', 'route.ts');
    const libSrc = readFileSync(libPath, 'utf8');
    const routeSrc = readFileSync(routePath, 'utf8');
    expect(libSrc).toContain('/twin-agent/');
    expect(libSrc).toContain('parseSurveyTwinAgentReportId');
    expect(routeSrc).toContain('resolveSurveyTwinAgentEngineUrl');
  });

  it('execute route dispatches webhooks', () => {
    const libPath = join(process.cwd(), 'api', 'lib', 'surveyTwinAgentExecute.ts');
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-agent', 'execute', 'route.ts');
    const libSrc = readFileSync(libPath, 'utf8');
    const routeSrc = readFileSync(routePath, 'utf8');
    expect(libSrc).toContain('agent_action');
    expect(routeSrc).toContain('dispatchTwinWebhook');
  });
});
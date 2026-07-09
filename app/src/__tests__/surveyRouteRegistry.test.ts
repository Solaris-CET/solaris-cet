// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  duplicatePaths,
  expectedSurveyBridgePaths,
  missingPathsInSource,
  parseServerSurveyRoutePaths,
  SERVER_ADMIN_SURVEY_PATHS,
  SERVER_OPENAPI_SURVEY_PATH,
} from '../../api/lib/surveyRouteRegistry';
import { SURVEY_ROUTE_IDS, surveyBridgePath } from '../../api/lib/surveyOpenApi';

const indexPath = join(process.cwd(), 'server', 'index.cjs');

function readServerIndex(): string {
  return readFileSync(indexPath, 'utf8');
}

describe('survey route registry', () => {
  it('server index registers all survey bridge routes', () => {
    const src = readServerIndex();
    const missing = missingPathsInSource(src, expectedSurveyBridgePaths());
    expect(missing, `missing routes: ${missing.join(', ')}`).toEqual([]);

    for (const id of SURVEY_ROUTE_IDS) {
      expect(src, `missing ${surveyBridgePath(id)}`).toContain(surveyBridgePath(id));
    }
  });

  it('registers OpenAPI and admin survey endpoints', () => {
    const src = readServerIndex();
    expect(src).toContain(SERVER_OPENAPI_SURVEY_PATH);
    for (const adminPath of SERVER_ADMIN_SURVEY_PATHS) {
      expect(src, `missing ${adminPath}`).toContain(adminPath);
    }
  });

  it('parseServerSurveyRoutePaths matches SURVEY_ROUTE_IDS cardinality', () => {
    const src = readServerIndex();
    const registered = parseServerSurveyRoutePaths(src);
    expect(registered).toHaveLength(SURVEY_ROUTE_IDS.length + 1);
    expect(duplicatePaths(registered)).toEqual([]);
    expect(registered).toContain(SERVER_OPENAPI_SURVEY_PATH);
  });

  it('each registered survey route has a TypeScript handler source file', () => {
    const src = readServerIndex();
    const tuplePattern = /\['(\/api\/survey\/[^']+|\/api\/openapi\/survey)',\s*'(api\/[^']+)'\]/g;
    const missingFiles: string[] = [];

    for (const match of src.matchAll(tuplePattern)) {
      const handler = match[2];
      if (!handler) continue;
      const tsPath = join(process.cwd(), handler.replace(/\.js$/, '.ts'));
      if (!existsSync(tsPath)) missingFiles.push(tsPath);
    }

    expect(missingFiles, `missing handlers: ${missingFiles.join(', ')}`).toEqual([]);
  });

  it('twin and offline routes are wired in server index', () => {
    const src = readServerIndex();
    const twinPaths = [
      '/api/survey/twin-events',
      '/api/survey/twin-replay',
      '/api/survey/twin-stream',
      '/api/survey/twin-webhook',
      '/api/survey/router/stats',
      '/api/survey/offline-manifest',
      '/api/survey/draft-sync',
    ];
    const missing = missingPathsInSource(src, twinPaths);
    expect(missing).toEqual([]);
  });
});
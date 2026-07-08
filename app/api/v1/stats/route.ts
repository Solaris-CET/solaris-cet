import { createPublicApiGetRoute } from '@/api/lib/publicApiRouteFactory';
import { buildPublicV1StatsBody, PUBLIC_V1_STATS_PROBE } from '@/api/lib/publicV1Stats';

export { PUBLIC_V1_STATS_PATH, PUBLIC_V1_STATS_PROBE } from '@/api/lib/publicV1Stats';

export const config = { runtime: 'nodejs' };

export default createPublicApiGetRoute(PUBLIC_V1_STATS_PROBE, (auth) => buildPublicV1StatsBody(auth.apiKeyId));

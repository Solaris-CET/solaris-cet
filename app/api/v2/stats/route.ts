import { createPublicApiGetRoute } from '@/api/lib/publicApiRouteFactory';
import { buildPublicV2StatsBody, PUBLIC_V2_STATS_PROBE } from '@/api/lib/publicV2Stats';

export { PUBLIC_V2_STATS_PATH, PUBLIC_V2_STATS_PROBE } from '@/api/lib/publicV2Stats';

export const config = { runtime: 'nodejs' };

export default createPublicApiGetRoute(PUBLIC_V2_STATS_PROBE, (auth) => buildPublicV2StatsBody(auth.apiKeyId));

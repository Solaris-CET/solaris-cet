import { createPublicApiGetRoute } from '@/api/lib/publicApiRouteFactory';
import { buildPublicV2PriceBody, PUBLIC_V2_PRICE_PROBE, resolveCetPriceUsdFromEnv } from '@/api/lib/publicV2Price';

export { PUBLIC_V2_PRICE_PATH, PUBLIC_V2_PRICE_PROBE } from '@/api/lib/publicV2Price';

export const config = { runtime: 'nodejs' };

export default createPublicApiGetRoute(PUBLIC_V2_PRICE_PROBE, () => buildPublicV2PriceBody(resolveCetPriceUsdFromEnv()));

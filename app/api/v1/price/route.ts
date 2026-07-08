import { createPublicApiGetRoute } from '@/api/lib/publicApiRouteFactory';
import { buildPublicV1PriceBody, PUBLIC_V1_PRICE_PROBE, resolveCetPriceUsdFromEnv } from '@/api/lib/publicV1Price';

export { PUBLIC_V1_PRICE_PATH, PUBLIC_V1_PRICE_PROBE } from '@/api/lib/publicV1Price';

export const config = { runtime: 'nodejs' };

export default createPublicApiGetRoute(PUBLIC_V1_PRICE_PROBE, () => buildPublicV1PriceBody(resolveCetPriceUsdFromEnv()));

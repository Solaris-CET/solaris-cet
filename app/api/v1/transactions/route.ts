import { createPublicApiCrudRoute } from '@/api/lib/publicApiRouteFactory';
import {
  buildPublicV1TransactionCreateBody,
  buildPublicV1TransactionsListBody,
  PUBLIC_V1_TRANSACTIONS_PROBE,
  publicV1TransactionCreateSchema,
  resolvePublicV1TransactionsRateLimit,
} from '@/api/lib/publicV1Transactions';
import { createTransaction, listTransactions } from '@/api/lib/publicTransactionsStore';
import { emitWebhookEvent } from '@/api/lib/publicWebhooksStore';

export { PUBLIC_V1_TRANSACTIONS_PATH, PUBLIC_V1_TRANSACTIONS_PROBE } from '@/api/lib/publicV1Transactions';

export const config = { runtime: 'nodejs' };

export default createPublicApiCrudRoute(PUBLIC_V1_TRANSACTIONS_PROBE, {
  createSchema: publicV1TransactionCreateSchema,
  resolveRateLimit: resolvePublicV1TransactionsRateLimit,
  buildListBody: buildPublicV1TransactionsListBody,
  buildCreateBody: (tx) => buildPublicV1TransactionCreateBody(tx),
  createEntity: createTransaction,
  listEntities: listTransactions,
  emitWebhookEvent: (userId, eventType, tx) => void emitWebhookEvent(userId, eventType, tx),
});

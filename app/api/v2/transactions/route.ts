import { createPublicApiCrudRoute } from '@/api/lib/publicApiRouteFactory';
import {
  buildPublicV2TransactionCreateBody,
  buildPublicV2TransactionsListBody,
  PUBLIC_V2_TRANSACTIONS_PROBE,
  publicV2TransactionCreateSchema,
  resolvePublicV2TransactionsRateLimit,
} from '@/api/lib/publicV2Transactions';
import { createTransaction, listTransactions } from '@/api/lib/publicTransactionsStore';
import { emitWebhookEvent } from '@/api/lib/publicWebhooksStore';

export { PUBLIC_V2_TRANSACTIONS_PATH, PUBLIC_V2_TRANSACTIONS_PROBE } from '@/api/lib/publicV2Transactions';

export const config = { runtime: 'nodejs' };

export default createPublicApiCrudRoute(PUBLIC_V2_TRANSACTIONS_PROBE, {
  createSchema: publicV2TransactionCreateSchema,
  resolveRateLimit: resolvePublicV2TransactionsRateLimit,
  buildListBody: buildPublicV2TransactionsListBody,
  buildCreateBody: (tx, input) => buildPublicV2TransactionCreateBody(tx, input.metadata),
  createEntity: createTransaction,
  listEntities: listTransactions,
  emitWebhookEvent: (userId, eventType, tx) => void emitWebhookEvent(userId, eventType, tx),
});

import { beginCell } from '@ton/core';

export function buildFixedStakingStakePayload(planId: number, queryId: bigint = 0n): string {
  return beginCell().storeUint(1, 32).storeUint(queryId, 64).storeUint(BigInt(planId), 8).endCell().toBoc().toString('base64');
}

export function buildFixedStakingClaimPayload(queryId: bigint = 0n): string {
  return beginCell().storeUint(2, 32).storeUint(queryId, 64).endCell().toBoc().toString('base64');
}

export function buildFixedStakingUnstakePayload(queryId: bigint = 0n): string {
  return beginCell().storeUint(3, 32).storeUint(queryId, 64).endCell().toBoc().toString('base64');
}


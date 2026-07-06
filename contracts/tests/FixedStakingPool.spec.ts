import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { FixedStakingPool } from '../wrappers/FixedStakingPool';
import '@ton/test-utils';

describe('FixedStakingPool', () => {
  let blockchain: Blockchain;
  let admin: SandboxContract<TreasuryContract>;
  let user: SandboxContract<TreasuryContract>;
  let pool: SandboxContract<FixedStakingPool>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    blockchain.now = 1_700_000_000;
    admin = await blockchain.treasury('admin');
    user = await blockchain.treasury('user');

    pool = blockchain.openContract(await FixedStakingPool.fromInit(admin.address));
    await admin.send({
      to: pool.address,
      value: toNano('2'),
      init: pool.init,
    });

    await pool.send(admin.getSender(), { value: toNano('0.2') }, { $$type: 'SetPlan', queryId: 0n, planId: 1n, durationSeconds: 7n * 24n * 60n * 60n, apyBps: 1200n });
  });

  it('stakes with fixed lock and tracks totals', async () => {
    await pool.send(user.getSender(), { value: toNano('1') }, { $$type: 'Stake', queryId: 0n, planId: 1n });
    expect(await pool.getTotalStaked()).toBe(toNano('1'));
    expect(await pool.getPrincipalOf(user.address)).toBe(toNano('1'));
    expect(await pool.getLockEndOf(user.address)).toBeGreaterThan(BigInt(blockchain.now ?? 0));
  });

  it('accrues rewards over time and allows claim', async () => {
    await pool.send(user.getSender(), { value: toNano('1') }, { $$type: 'Stake', queryId: 0n, planId: 1n });

    blockchain.now = (blockchain.now ?? 0) + 24 * 60 * 60;
    const pending = await pool.getPendingReward(user.address);
    expect(pending).toBeGreaterThan(0n);

    const res = await pool.send(user.getSender(), { value: toNano('0.05') }, { $$type: 'Claim', queryId: 0n });
    expect(res.transactions).toHaveTransaction({ from: user.address, to: pool.address, success: true });

    const pendingAfter = await pool.getPendingReward(user.address);
    expect(pendingAfter).toBe(0n);
  });

  it('prevents early unstake and allows unstake after lock', async () => {
    await pool.send(user.getSender(), { value: toNano('1') }, { $$type: 'Stake', queryId: 0n, planId: 1n });

    const early = await pool.send(user.getSender(), { value: toNano('0.05') }, { $$type: 'Unstake', queryId: 0n });
    expect(early.transactions).toHaveTransaction({ from: user.address, to: pool.address, success: false });

    blockchain.now = (blockchain.now ?? 0) + 8 * 24 * 60 * 60;
    const ok = await pool.send(user.getSender(), { value: toNano('0.05') }, { $$type: 'Unstake', queryId: 0n });
    expect(ok.transactions).toHaveTransaction({ from: user.address, to: pool.address, success: true });
    expect(await pool.getPrincipalOf(user.address)).toBe(0n);
  });
});

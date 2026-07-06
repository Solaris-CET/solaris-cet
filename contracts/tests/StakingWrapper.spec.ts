import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { StakingWrapper } from '../wrappers/StakingWrapper';
import '@ton/test-utils';

describe('StakingWrapper', () => {
  let blockchain: Blockchain;
  let user0: SandboxContract<TreasuryContract>;
  let user1: SandboxContract<TreasuryContract>;
  let staking: SandboxContract<StakingWrapper>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    user0 = await blockchain.treasury('user0');
    user1 = await blockchain.treasury('user1');

    staking = blockchain.openContract(await StakingWrapper.fromInit());
    await user0.send({
      to: staking.address,
      value: toNano('1'),
      init: staking.init,
    });
  });

  it('mints shares on stake and updates totals', async () => {
    await staking.send(user0.getSender(), { value: toNano('0.2') }, { $$type: 'Stake', queryId: 0n, amount: toNano('0.1') });
    await staking.send(user1.getSender(), { value: toNano('0.2') }, { $$type: 'Stake', queryId: 0n, amount: toNano('0.2') });

    expect(await staking.getTotalStaked()).toBe(toNano('0.3'));
    expect(await staking.getTotalShares()).toBeGreaterThan(0n);
    expect(await staking.getSharesOf(user0.address)).toBeGreaterThan(0n);
    expect(await staking.getSharesOf(user1.address)).toBeGreaterThan(0n);
  });

  it('burns shares on unstake', async () => {
    await staking.send(user0.getSender(), { value: toNano('0.2') }, { $$type: 'Stake', queryId: 0n, amount: toNano('0.1') });
    const sharesBefore = await staking.getSharesOf(user0.address);
    await staking.send(user0.getSender(), { value: toNano('0.2') }, { $$type: 'Unstake', queryId: 0n, shares: sharesBefore / 2n });
    const sharesAfter = await staking.getSharesOf(user0.address);
    expect(sharesAfter).toBeLessThan(sharesBefore);
  });
});

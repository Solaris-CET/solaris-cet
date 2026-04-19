import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { SupplyTracker } from '../wrappers/SupplyTracker';
import '@ton/test-utils';

describe('SupplyTracker', () => {
  let blockchain: Blockchain;
  let admin: SandboxContract<TreasuryContract>;
  let user: SandboxContract<TreasuryContract>;
  let tracker: SandboxContract<SupplyTracker>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    admin = await blockchain.treasury('admin');
    user = await blockchain.treasury('user');

    tracker = blockchain.openContract(await SupplyTracker.fromInit(admin.address));
    await admin.send({
      to: tracker.address,
      value: toNano('0.5'),
      init: tracker.init,
    });
  });

  it('allows admin to update supply within cap', async () => {
    await tracker.send(admin.getSender(), { value: toNano('0.1') }, { $$type: 'UpdateSupply', queryId: 0n, totalSupply: 9000n });
    expect(await tracker.getSupply()).toBe(9000n);
    expect(await tracker.getMaxSupply()).toBe(9000n);
  });

  it('rejects non-admin updates', async () => {
    const res = await tracker.send(user.getSender(), { value: toNano('0.1') }, { $$type: 'UpdateSupply', queryId: 0n, totalSupply: 1n });
    expect(res.transactions).toHaveTransaction({
      from: user.address,
      to: tracker.address,
      success: false,
    });
  });

  it('supports two-step admin rotation', async () => {
    const nextAdmin = await blockchain.treasury('nextAdmin');
    await tracker.send(admin.getSender(), { value: toNano('0.1') }, { $$type: 'ProposeAdmin', queryId: 1n, newAdmin: nextAdmin.address });
    expect(await tracker.getPendingAdmin()).toEqualAddress(nextAdmin.address);

    const badAccept = await tracker.send(user.getSender(), { value: toNano('0.1') }, { $$type: 'AcceptAdmin', queryId: 2n });
    expect(badAccept.transactions).toHaveTransaction({ from: user.address, to: tracker.address, success: false });

    await tracker.send(nextAdmin.getSender(), { value: toNano('0.1') }, { $$type: 'AcceptAdmin', queryId: 3n });
    expect(await tracker.getAdmin()).toEqualAddress(nextAdmin.address);
    expect(await tracker.getPendingAdmin()).toBeNull();

    const oldAdminUpdate = await tracker.send(admin.getSender(), { value: toNano('0.1') }, { $$type: 'UpdateSupply', queryId: 4n, totalSupply: 100n });
    expect(oldAdminUpdate.transactions).toHaveTransaction({ from: admin.address, to: tracker.address, success: false });
  });
});

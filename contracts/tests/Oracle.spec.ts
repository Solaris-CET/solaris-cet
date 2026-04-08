import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Oracle } from '../wrappers/Oracle';
import '@ton/test-utils';

describe('Oracle', () => {
  let blockchain: Blockchain;
  let admin: SandboxContract<TreasuryContract>;
  let user: SandboxContract<TreasuryContract>;
  let oracle: SandboxContract<Oracle>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    admin = await blockchain.treasury('admin');
    user = await blockchain.treasury('user');

    oracle = blockchain.openContract(await Oracle.fromInit(admin.address));
    await admin.send({
      to: oracle.address,
      value: toNano('0.5'),
      init: oracle.init,
    });
  });

  it('updates price when called by admin', async () => {
    await oracle.send(admin.getSender(), { value: toNano('0.1') }, { $$type: 'UpdatePrice', queryId: 0n, newPrice: 42n });
    expect(await oracle.getPrice()).toBe(42n);
    expect(await oracle.getLastUpdate()).toBeGreaterThan(0n);
  });

  it('rejects non-admin updates', async () => {
    const res = await oracle.send(user.getSender(), { value: toNano('0.1') }, { $$type: 'UpdatePrice', queryId: 0n, newPrice: 1n });
    expect(res.transactions).toHaveTransaction({
      from: user.address,
      to: oracle.address,
      success: false,
    });
  });
});

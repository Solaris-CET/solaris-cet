import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Compliance } from '../wrappers/Compliance';
import '@ton/test-utils';

describe('Compliance', () => {
  let blockchain: Blockchain;
  let admin: SandboxContract<TreasuryContract>;
  let user: SandboxContract<TreasuryContract>;
  let compliance: SandboxContract<Compliance>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    admin = await blockchain.treasury('admin');
    user = await blockchain.treasury('user');

    compliance = blockchain.openContract(await Compliance.fromInit(admin.address));
    await admin.send({
      to: compliance.address,
      value: toNano('0.5'),
      init: compliance.init,
    });
  });

  it('requires both kyc and consent', async () => {
    expect(await compliance.getIsCompliant(user.address)).toBe(false);
    await compliance.send(user.getSender(), { value: toNano('0.1') }, { $$type: 'SetConsent', queryId: 0n, consent: true });
    expect(await compliance.getIsCompliant(user.address)).toBe(false);
    await compliance.send(admin.getSender(), { value: toNano('0.1') }, { $$type: 'VerifyKYC', queryId: 0n, user: user.address });
    expect(await compliance.getIsCompliant(user.address)).toBe(true);
  });
});

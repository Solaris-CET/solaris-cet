import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address } from '@ton/core';
import { R2ATaskBoard } from '../wrappers/R2ATaskBoard';
import '@ton/test-utils';

describe('R2ATaskBoard', () => {
  let blockchain: Blockchain;
  let admin: SandboxContract<TreasuryContract>;
  let user: SandboxContract<TreasuryContract>;
  let board: SandboxContract<R2ATaskBoard>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    blockchain.now = 1_700_000_000;
    admin = await blockchain.treasury('admin');
    user = await blockchain.treasury('user');

    board = blockchain.openContract(await R2ATaskBoard.fromInit(admin.address));
    await admin.send({
      to: board.address,
      value: toNano('0.2'),
      init: board.init,
    });
  });

  it('stores a submission', async () => {
    const submitter = user.address;
    const queryId = 123n;
    const contentHash = 456n;
    const res = await board.send(
      user.getSender(),
      { value: toNano('0.05') },
      {
        $$type: 'R2ASubmit',
        queryId,
        complexity: 2n,
        hoursScaled: 150n,
        stakeNanoCET: 1_000_000n,
        submitter,
        contentHash,
      },
    );
    expect(res.transactions).toHaveTransaction({ from: user.address, to: board.address, success: true });
    expect(await board.getSubmissionCount()).toBe(1n);

    const stored = await board.getSubmission(queryId);
    expect(stored).not.toBeNull();
    const s = stored as unknown as { submitter: Address; complexity: bigint; hoursScaled: bigint; stakeNanoCET: bigint; contentHash: bigint };
    expect(s.submitter.toString()).toBe(submitter.toString());
    expect(s.complexity).toBe(2n);
    expect(s.hoursScaled).toBe(150n);
    expect(s.stakeNanoCET).toBe(1_000_000n);
    expect(s.contentHash).toBe(contentHash);
  });
});


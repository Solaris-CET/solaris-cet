/**
 * MultisigWrapper.spec.ts
 *
 * Blueprint / Sandbox unit tests for the 2-of-3 Multi-Signature Wrapper contract.
 *
 * These tests run locally against the TON Sandbox — no mainnet interaction.
 *
 * Run:
 *   cd contracts && npm test
 */

import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { MultiSigWrapper } from '../wrappers/MultiSigWrapper';
import '@ton/test-utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Send a message through the contract's typed send method. */
async function sendMsg(
    multisig: SandboxContract<MultiSigWrapper>,
    from: SandboxContract<TreasuryContract>,
    msg: Parameters<MultiSigWrapper['send']>[3],
    value = toNano('0.1'),
) {
    return multisig.send(from.getSender(), { value }, msg);
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('MultiSigWrapper — 2-of-3 threshold', () => {
    let blockchain: Blockchain;
    let signer0: SandboxContract<TreasuryContract>;
    let signer1: SandboxContract<TreasuryContract>;
    let signer2: SandboxContract<TreasuryContract>;
    let nonSigner: SandboxContract<TreasuryContract>;
    let recipient: SandboxContract<TreasuryContract>;
    let multisig: SandboxContract<MultiSigWrapper>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        signer0   = await blockchain.treasury('signer0');
        signer1   = await blockchain.treasury('signer1');
        signer2   = await blockchain.treasury('signer2');
        nonSigner = await blockchain.treasury('nonSigner');
        recipient = await blockchain.treasury('recipient');

        // Deploy with signer0 as initial owner, threshold=1 so governance
        // proposals can be created and executed by signer0 alone.
        multisig = blockchain.openContract(
            await MultiSigWrapper.fromInit(signer0.address, 1n)
        );
        await signer0.send({
            to: multisig.address,
            value: toNano('10'),
            init: multisig.init,
        });

        // Add signer1 (proposes + executes with current 1-of-1 threshold)
        await sendMsg(multisig, signer0, { $$type: 'ProposeAddOwner', queryId: 0n, newOwner: signer1.address });
        await sendMsg(multisig, signer0, { $$type: 'Execute', queryId: 0n, proposalId: 0n });

        // Add signer2
        await sendMsg(multisig, signer0, { $$type: 'ProposeAddOwner', queryId: 0n, newOwner: signer2.address });
        await sendMsg(multisig, signer0, { $$type: 'Execute', queryId: 0n, proposalId: 1n });

        // Raise threshold to 2 (2-of-3)
        await sendMsg(multisig, signer0, { $$type: 'ProposeUpdateThreshold', queryId: 0n, newThreshold: 2n });
        await sendMsg(multisig, signer0, { $$type: 'Execute', queryId: 0n, proposalId: 2n });
    });

    // ── 1. Deployment ────────────────────────────────────────────────────────

    it('deploys with three owners at 2-of-3 threshold', async () => {
        expect(await multisig.getOwnerCount()).toBe(3n);
        expect(await multisig.getThreshold()).toBe(2n);
        expect(await multisig.getIsOwner(signer0.address)).toBe(true);
        expect(await multisig.getIsOwner(signer1.address)).toBe(true);
        expect(await multisig.getIsOwner(signer2.address)).toBe(true);
        expect(await multisig.getIsOwner(nonSigner.address)).toBe(false);
    });

    // ── 2. Proposal creation ─────────────────────────────────────────────────

    it('allows a signer to create a transfer proposal', async () => {
        const idBefore = await multisig.getNextProposalId();
        const result = await sendMsg(multisig, signer0,
            { $$type: 'Propose', queryId: 0n, to: recipient.address, value: toNano('1'), payload: null });

        expect(result.transactions).toHaveTransaction({
            from: signer0.address,
            to: multisig.address,
            success: true,
        });
        expect(await multisig.getNextProposalId()).toBe(idBefore + 1n);
    });

    it('rejects a proposal from a non-signer', async () => {
        const result = await sendMsg(multisig, nonSigner,
            { $$type: 'Propose', queryId: 0n, to: recipient.address, value: toNano('1'), payload: null });

        expect(result.transactions).toHaveTransaction({
            from: nonSigner.address,
            to: multisig.address,
            success: false,
        });
    });

    // ── 3. Sign & Execute ────────────────────────────────────────────────────

    it('executes transfer when second signer signs (2-of-3)', async () => {
        const proposalId = await multisig.getNextProposalId();
        const sendValue  = toNano('1');

        // signer0 proposes
        await sendMsg(multisig, signer0,
            { $$type: 'Propose', queryId: 0n, to: recipient.address, value: sendValue, payload: null });

        // signer1 signs
        await sendMsg(multisig, signer1,
            { $$type: 'Sign', queryId: 0n, proposalId });

        const recipientBefore = await recipient.getBalance();

        // signer0 executes
        const execResult = await sendMsg(multisig, signer0,
            { $$type: 'Execute', queryId: 0n, proposalId });

        expect(execResult.transactions).toHaveTransaction({
            from: multisig.address,
            to: recipient.address,
            success: true,
        });
        expect(await recipient.getBalance()).toBeGreaterThan(recipientBefore);

        const proposal = await multisig.getGetProposal(proposalId);
        expect(proposal!.executed).toBe(true);
    });

    it('does NOT execute with only one signature (threshold=2)', async () => {
        const proposalId = await multisig.getNextProposalId();

        await sendMsg(multisig, signer0,
            { $$type: 'Propose', queryId: 0n, to: recipient.address, value: toNano('1'), payload: null });

        // Attempt execute with only signer0's signature
        const result = await sendMsg(multisig, signer0,
            { $$type: 'Execute', queryId: 0n, proposalId });

        expect(result.transactions).toHaveTransaction({
            from: signer0.address,
            to: multisig.address,
            success: false,
        });

        const proposal = await multisig.getGetProposal(proposalId);
        expect(proposal!.executed).toBe(false);
        expect(proposal!.signCount).toBe(1n);
    });

    it('prevents double-execution of an already-executed proposal', async () => {
        const proposalId = await multisig.getNextProposalId();

        await sendMsg(multisig, signer0,
            { $$type: 'Propose', queryId: 0n, to: recipient.address, value: toNano('1'), payload: null });
        await sendMsg(multisig, signer1,
            { $$type: 'Sign', queryId: 0n, proposalId });
        await sendMsg(multisig, signer0,
            { $$type: 'Execute', queryId: 0n, proposalId });

        // Second execute should fail
        const result = await sendMsg(multisig, signer0,
            { $$type: 'Execute', queryId: 0n, proposalId });

        expect(result.transactions).toHaveTransaction({
            from: signer0.address,
            to: multisig.address,
            success: false,
        });
    });

    // ── 4. Revocation ────────────────────────────────────────────────────────

    it('allows a signer to revoke their own signature', async () => {
        const proposalId = await multisig.getNextProposalId();

        await sendMsg(multisig, signer0,
            { $$type: 'Propose', queryId: 0n, to: recipient.address, value: toNano('1'), payload: null });
        await sendMsg(multisig, signer1,
            { $$type: 'Sign', queryId: 0n, proposalId });

        // signer1 revokes
        const revokeResult = await sendMsg(multisig, signer1,
            { $$type: 'Revoke', queryId: 0n, proposalId });

        expect(revokeResult.transactions).toHaveTransaction({
            from: signer1.address,
            to: multisig.address,
            success: true,
        });

        // Now only 1 signature — execute should fail
        const result = await sendMsg(multisig, signer0,
            { $$type: 'Execute', queryId: 0n, proposalId });

        expect(result.transactions).toHaveTransaction({
            from: signer0.address,
            to: multisig.address,
            success: false,
        });
    });

    // ── 5. Proposal counter ──────────────────────────────────────────────────

    it('increments proposal ID for each new proposal', async () => {
        const idBefore = await multisig.getNextProposalId();
        const propose = { $$type: 'Propose' as const, queryId: 0n, to: recipient.address, value: toNano('0.5'), payload: null };
        await sendMsg(multisig, signer0, propose);
        await sendMsg(multisig, signer0, propose);

        expect(await multisig.getNextProposalId()).toBe(idBefore + 2n);
    });
});

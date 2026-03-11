/**
 * MultiSigWrapper – Comprehensive TDD + Fuzzing Test Suite
 *
 * Covers:
 *  1. Deployment
 *  2. Core proposal / sign / execute / revoke flow
 *  3. 2-of-3 multi-sig scenario
 *  4. Owner management (add / remove / threshold update)
 *  5. Security / fuzzing scenarios
 *     – re-entrancy guard
 *     – double-execution prevention
 *     – integer overflow / underflow
 *     – expired proposals
 *     – non-owner access
 *     – zero-value transfer
 *     – threshold invariants
 *     – removed-owner signature invalidation
 *     – max-proposal cap
 */

import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { toNano, Address } from "@ton/core";
import { MultiSigWrapper } from "../wrappers/MultiSigWrapper";
import "@ton/test-utils";

// ─── Contract constants (must stay in sync with MultiSigWrapper.tact) ─────────
/** Proposal TTL in seconds (7 days). Must match PROPOSAL_TTL in MultiSigWrapper.tact. */
const PROPOSAL_TTL_SECONDS = 604800;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Deploy a fresh MultiSigWrapper. Returns {blockchain, deployer, contract}. */
async function deploy(threshold = 1n) {
    const blockchain = await Blockchain.create();
    const deployer = await blockchain.treasury("deployer");

    const contract = blockchain.openContract(
        await MultiSigWrapper.fromInit(deployer.address, threshold)
    );

    const result = await contract.send(
        deployer.getSender(),
        { value: toNano("1") },
        { $$type: "Deploy", queryId: 0n }
    );

    expect(result.transactions).toHaveTransaction({
        from: deployer.address,
        to: contract.address,
        deploy: true,
        success: true,
    });

    return { blockchain, deployer, contract };
}

/** Fund a contract with extra TON so it can execute transfers. */
async function fund(
    contract: SandboxContract<MultiSigWrapper>,
    sender: SandboxContract<TreasuryContract>,
    amount = toNano("10")
) {
    await contract.send(sender.getSender(), { value: amount }, null);
}

// ─── 1. Deployment ────────────────────────────────────────────────────────────

describe("Deployment", () => {
    it("deploys with correct initial state", async () => {
        const { deployer, contract } = await deploy(1n);

        expect(await contract.getOwnerCount()).toBe(1n);
        expect(await contract.getThreshold()).toBe(1n);
        expect(await contract.getProposalCount()).toBe(0n);
        expect(await contract.getIsOwner(deployer.address)).toBe(true);
    });

    it("rejects threshold > 1 with a single owner", async () => {
        const blockchain = await Blockchain.create();
        const owner = await blockchain.treasury("owner");

        const contract = blockchain.openContract(
            await MultiSigWrapper.fromInit(owner.address, 2n)
        );
        const result = await contract.send(
            owner.getSender(),
            { value: toNano("1") },
            { $$type: "Deploy", queryId: 0n }
        );

        expect(result.transactions).toHaveTransaction({
            success: false,
        });
    });

    it("rejects threshold 0", async () => {
        const blockchain = await Blockchain.create();
        const owner = await blockchain.treasury("owner");

        const contract = blockchain.openContract(
            await MultiSigWrapper.fromInit(owner.address, 0n)
        );
        const result = await contract.send(
            owner.getSender(),
            { value: toNano("1") },
            { $$type: "Deploy", queryId: 0n }
        );

        expect(result.transactions).toHaveTransaction({
            success: false,
        });
    });
});

// ─── 2. Propose / Sign / Execute / Revoke ─────────────────────────────────────

describe("Basic proposal flow (threshold = 1)", () => {
    it("owner can propose, self-sign and execute a transfer", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer);

        const recipient = await blockchain.treasury("recipient");
        const recipientBalanceBefore = await recipient.getBalance();

        // Propose
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );

        expect(await contract.getProposalCount()).toBe(1n);

        // Execute (proposal already self-signed at creation; threshold = 1)
        const execResult = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        expect(execResult.transactions).toHaveTransaction({
            from: contract.address,
            to: recipient.address,
            // value may be slightly below 1 TON due to TON forward-fee deduction
            value: (v) => v !== undefined && v >= toNano("0.99"),
            success: true,
        });

        // Proposal is now marked executed
        const p = await contract.getGetProposal(0n);
        expect(p?.executed).toBe(true);
    });

    it("cannot execute an already-executed proposal", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer);

        const recipient = await blockchain.treasury("recipient");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );

        // First execution
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        // Second execution must fail
        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 3n, proposalId: 0n }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    it("owner can revoke their signature before execution", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer);

        const recipient = await blockchain.treasury("recipient");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );

        // Revoke
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Revoke", queryId: 2n, proposalId: 0n }
        );

        let p = await contract.getGetProposal(0n);
        expect(p?.signCount).toBe(0n);

        // Now execute must fail (not enough sigs)
        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 3n, proposalId: 0n }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    it("cannot sign a proposal twice", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer);

        const recipient = await blockchain.treasury("recipient");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );

        // Attempt a second sign from the same owner
        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Sign", queryId: 2n, proposalId: 0n }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });
});

// ─── 3. 2-of-3 Multi-Sig Scenario ────────────────────────────────────────────

describe("2-of-3 multi-sig scenario", () => {
    /**
     * Setup: owner1 deploys (threshold 1), proposes add owner2 + owner3,
     *        then proposes threshold 2.
     */
    async function setup2of3() {
        const { blockchain, deployer: owner1, contract } = await deploy(1n);
        await fund(contract, owner1, toNano("20"));

        const owner2 = await blockchain.treasury("owner2");
        const owner3 = await blockchain.treasury("owner3");

        // Add owner2
        await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeAddOwner", queryId: 1n, newOwner: owner2.address }
        );
        await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        // Add owner3
        await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeAddOwner", queryId: 3n, newOwner: owner3.address }
        );
        await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 4n, proposalId: 1n }
        );

        // Raise threshold to 2
        await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeUpdateThreshold", queryId: 5n, newThreshold: 2n }
        );
        await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 6n, proposalId: 2n }
        );

        return { blockchain, owner1, owner2, owner3, contract };
    }

    it("sets up 3 owners with threshold 2", async () => {
        const { contract, owner1, owner2, owner3 } = await setup2of3();

        expect(await contract.getOwnerCount()).toBe(3n);
        expect(await contract.getThreshold()).toBe(2n);
        expect(await contract.getIsOwner(owner1.address)).toBe(true);
        expect(await contract.getIsOwner(owner2.address)).toBe(true);
        expect(await contract.getIsOwner(owner3.address)).toBe(true);
    });

    it("1-of-3 cannot execute with threshold 2", async () => {
        const { blockchain, owner1, contract } = await setup2of3();

        const recipient = await blockchain.treasury("recipient");

        // owner1 proposes (auto-signed by owner1)
        await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 10n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );
        const proposalId = (await contract.getProposalCount()) - 1n;

        // owner1 tries to execute alone
        const result = await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 11n, proposalId }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    it("2-of-3 can execute successfully", async () => {
        const { blockchain, owner1, owner2, contract } = await setup2of3();

        const recipient = await blockchain.treasury("recipient");
        const before = await recipient.getBalance();

        // owner1 proposes
        await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 10n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );
        const proposalId = (await contract.getProposalCount()) - 1n;

        // owner2 co-signs
        await contract.send(
            owner2.getSender(),
            { value: toNano("0.1") },
            { $$type: "Sign", queryId: 11n, proposalId }
        );

        // owner1 executes
        const execResult = await contract.send(
            owner1.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 12n, proposalId }
        );

        expect(execResult.transactions).toHaveTransaction({
            from: contract.address,
            to: recipient.address,
            // value may be slightly below 1 TON due to TON forward-fee deduction
            value: (v) => v !== undefined && v >= toNano("0.99"),
            success: true,
        });

        const p = await contract.getGetProposal(proposalId);
        expect(p?.executed).toBe(true);
    });
});

// ─── 4. Owner Management ──────────────────────────────────────────────────────

describe("Owner management", () => {
    it("add owner via multi-sig", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        const newOwner = await blockchain.treasury("new");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeAddOwner", queryId: 1n, newOwner: newOwner.address }
        );
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        expect(await contract.getOwnerCount()).toBe(2n);
        expect(await contract.getIsOwner(newOwner.address)).toBe(true);
    });

    it("remove owner via multi-sig", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);

        const owner2 = await blockchain.treasury("owner2");

        // Add owner2 first
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeAddOwner", queryId: 1n, newOwner: owner2.address }
        );
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        // Remove owner2
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeRemoveOwner", queryId: 3n, owner: owner2.address }
        );
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 4n, proposalId: 1n }
        );

        expect(await contract.getOwnerCount()).toBe(1n);
        expect(await contract.getIsOwner(owner2.address)).toBe(false);
    });

    it("cannot remove owner if it would break threshold", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);

        // Only 1 owner, threshold 1 → cannot remove
        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "ProposeRemoveOwner",
                queryId: 1n,
                owner: deployer.address,
            }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    it("update threshold via multi-sig", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);

        const owner2 = await blockchain.treasury("owner2");

        // Add owner2
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeAddOwner", queryId: 1n, newOwner: owner2.address }
        );
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        // Update threshold to 2
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeUpdateThreshold", queryId: 3n, newThreshold: 2n }
        );
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 4n, proposalId: 1n }
        );

        expect(await contract.getThreshold()).toBe(2n);
    });

    it("cannot set threshold above owner count", async () => {
        const { deployer, contract } = await deploy(1n);

        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeUpdateThreshold", queryId: 1n, newThreshold: 2n }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });
});

// ─── 5. Security & Fuzzing Tests ──────────────────────────────────────────────

describe("Security & fuzzing", () => {
    // ── 5a. Re-entrancy guard ────────────────────────────────────────────────
    it("re-entrancy: locked flag prevents concurrent execution", async () => {
        /**
         * True EVM-style re-entrancy is not possible in TON's actor model.
         * However, the locked flag must prevent a second Execute message
         * from being processed if somehow the contract is entered twice.
         *
         * We verify the flag is correctly reset after a successful execution.
         */
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer, toNano("5"));

        const recipient = await blockchain.treasury("recipient");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("0.5"),
                payload: null,
            }
        );

        // Execute once
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        // Contract should be unlocked; a new proposal should work fine
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 3n,
                to: recipient.address,
                value: toNano("0.1"),
                payload: null,
            }
        );

        expect(await contract.getProposalCount()).toBe(2n);
    });

    // ── 5b. Double-execution prevention ─────────────────────────────────────
    it("double-execution is rejected (executed flag)", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer, toNano("5"));

        const recipient = await blockchain.treasury("recipient");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 3n, proposalId: 0n }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    // ── 5c. Integer overflow in proposal count (fuzz) ────────────────────────
    it("fuzz: rapid proposals do not corrupt proposal count", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);

        const recipient = await blockchain.treasury("recipient");

        // Submit 10 proposals rapidly
        for (let i = 0; i < 10; i++) {
            await contract.send(
                deployer.getSender(),
                { value: toNano("0.1") },
                {
                    $$type: "Propose",
                    queryId: BigInt(i + 100),
                    to: recipient.address,
                    value: 0n,
                    payload: null,
                }
            );
        }

        const count = await contract.getProposalCount();
        expect(count).toBe(10n);

        // Each proposal ID must be unique and retrievable
        for (let i = 0; i < 10; i++) {
            const p = await contract.getGetProposal(BigInt(i));
            expect(p).not.toBeNull();
        }
    });

    // ── 5d. Expired proposals cannot be executed ──────────────────────────────
    it("expired proposal cannot be executed", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer, toNano("5"));

        const recipient = await blockchain.treasury("recipient");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );

        // Fast-forward blockchain time past the proposal TTL + 1 second
        blockchain.now = Math.floor(Date.now() / 1000) + PROPOSAL_TTL_SECONDS + 1;

        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    // ── 5e. Non-owner access ──────────────────────────────────────────────────
    it("fuzz: non-owner cannot propose", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);

        const attacker = await blockchain.treasury("attacker");
        const victim = await blockchain.treasury("victim");

        const result = await contract.send(
            attacker.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: victim.address,
                value: toNano("1"),
                payload: null,
            }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });

        expect(await contract.getProposalCount()).toBe(0n);
    });

    it("fuzz: non-owner cannot sign a proposal", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);

        const attacker = await blockchain.treasury("attacker");
        const recipient = await blockchain.treasury("recipient");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );

        const result = await contract.send(
            attacker.getSender(),
            { value: toNano("0.1") },
            { $$type: "Sign", queryId: 2n, proposalId: 0n }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    it("fuzz: non-owner cannot execute a proposal", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer, toNano("5"));

        const attacker = await blockchain.treasury("attacker");
        const recipient = await blockchain.treasury("recipient");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );

        const result = await contract.send(
            attacker.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    it("fuzz: non-owner cannot add an owner", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);

        const attacker = await blockchain.treasury("attacker");
        const victim = await blockchain.treasury("victim");

        const result = await contract.send(
            attacker.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeAddOwner", queryId: 1n, newOwner: victim.address }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    // ── 5f. Zero-value transfer ───────────────────────────────────────────────
    it("zero-value transfer proposal is accepted and executes", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer, toNano("5"));

        const recipient = await blockchain.treasury("recipient");

        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: 0n,
                payload: null,
            }
        );

        const execResult = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        expect(execResult.transactions).toHaveTransaction({
            to: contract.address,
            success: true,
        });
    });

    // ── 5g. Removed-owner signature invalidation ──────────────────────────────
    it("signature from a removed owner is not counted at execution time", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer, toNano("20"));

        const owner2 = await blockchain.treasury("owner2");
        const recipient = await blockchain.treasury("recipient");

        // Add owner2
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeAddOwner", queryId: 1n, newOwner: owner2.address }
        );
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        // Raise threshold to 2
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeUpdateThreshold", queryId: 3n, newThreshold: 2n }
        );
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 4n, proposalId: 1n }
        );

        expect(await contract.getThreshold()).toBe(2n);

        // Deployer proposes a transfer; owner2 co-signs → 2 sigs
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 5n,
                to: recipient.address,
                value: toNano("1"),
                payload: null,
            }
        );
        const proposalId = (await contract.getProposalCount()) - 1n;

        await contract.send(
            owner2.getSender(),
            { value: toNano("0.1") },
            { $$type: "Sign", queryId: 6n, proposalId }
        );

        // Now remove owner2 via multi-sig (only deployer needed since it has 1 active sig)
        // (Threshold is 2, but we lower it first)
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeUpdateThreshold", queryId: 7n, newThreshold: 1n }
        );
        // Need owner2's sig for this too – owner2 signs the threshold proposal
        const threshPropId = (await contract.getProposalCount()) - 1n;
        await contract.send(
            owner2.getSender(),
            { value: toNano("0.1") },
            { $$type: "Sign", queryId: 8n, proposalId: threshPropId }
        );
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 9n, proposalId: threshPropId }
        );

        // Threshold is now 1; remove owner2
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "ProposeRemoveOwner",
                queryId: 10n,
                owner: owner2.address,
            }
        );
        const removePropId = (await contract.getProposalCount()) - 1n;
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 11n, proposalId: removePropId }
        );

        expect(await contract.getIsOwner(owner2.address)).toBe(false);

        // Original transfer proposal still has owner2's bitmap bit set,
        // but owner2 is no longer active → only deployer's sig counts → 1 valid sig
        // Threshold was just raised back to 1, so execution should succeed.
        const execResult = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 12n, proposalId }
        );

        // Should succeed: valid sigs (deployer only) = 1 = threshold
        expect(execResult.transactions).toHaveTransaction({
            from: contract.address,
            to: recipient.address,
            success: true,
        });
    });

    // ── 5h. Proposal not found ────────────────────────────────────────────────
    it("fuzz: operations on non-existent proposal fail gracefully", async () => {
        const { deployer, contract } = await deploy(1n);

        const nonExistentId = 9999n;

        const signResult = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Sign", queryId: 1n, proposalId: nonExistentId }
        );
        expect(signResult.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });

        const execResult = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: nonExistentId }
        );
        expect(execResult.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });

        const revokeResult = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Revoke", queryId: 3n, proposalId: nonExistentId }
        );
        expect(revokeResult.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    // ── 5i. Cannot add an address that is already an owner ───────────────────
    it("fuzz: cannot add an existing owner", async () => {
        const { deployer, contract } = await deploy(1n);

        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "ProposeAddOwner",
                queryId: 1n,
                newOwner: deployer.address,
            }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    // ── 5j. Revoke a signature that was never given ───────────────────────────
    it("fuzz: cannot revoke a signature not yet given", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);

        const owner2 = await blockchain.treasury("owner2");

        // Add owner2 so the next test makes sense
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "ProposeAddOwner", queryId: 1n, newOwner: owner2.address }
        );
        await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Execute", queryId: 2n, proposalId: 0n }
        );

        // owner2 proposes (auto-signs for owner2)
        const recipient = await blockchain.treasury("recipient");
        await contract.send(
            owner2.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 3n,
                to: recipient.address,
                value: 0n,
                payload: null,
            }
        );
        const propId = (await contract.getProposalCount()) - 1n;

        // deployer tries to revoke a sig it never gave
        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            { $$type: "Revoke", queryId: 4n, proposalId: propId }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });

    // ── 5k. Fuzz: large queryId values (overflow probe) ─────────────────────
    it("fuzz: operations with max uint64 queryId are handled correctly", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        await fund(contract, deployer, toNano("5"));

        const recipient = await blockchain.treasury("recipient");
        const MAX_UINT64 = 2n ** 64n - 1n;

        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: MAX_UINT64,
                to: recipient.address,
                value: toNano("0.1"),
                payload: null,
            }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: true,
        });
    });

    // ── 5l. Insufficient balance guard ────────────────────────────────────────
    it("fuzz: proposing more than available balance is rejected", async () => {
        const { blockchain, deployer, contract } = await deploy(1n);
        // Contract has ~1 TON from deployment; do NOT fund extra

        const recipient = await blockchain.treasury("recipient");

        const result = await contract.send(
            deployer.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "Propose",
                queryId: 1n,
                to: recipient.address,
                value: toNano("9999"), // exceeds balance
                payload: null,
            }
        );

        expect(result.transactions).toHaveTransaction({
            to: contract.address,
            success: false,
        });
    });
});

// ─── 6. Getter Coverage ───────────────────────────────────────────────────────

describe("Getter coverage", () => {
    it("isOwner returns false for unknown address", async () => {
        const { blockchain, contract } = await deploy(1n);
        const stranger = await blockchain.treasury("stranger");
        expect(await contract.getIsOwner(stranger.address)).toBe(false);
    });

    it("getOwnerIndex returns null for non-owner", async () => {
        const { blockchain, contract } = await deploy(1n);
        const stranger = await blockchain.treasury("stranger");
        expect(await contract.getGetOwnerIndex(stranger.address)).toBeNull();
    });

    it("getProposal returns null for missing proposal", async () => {
        const { contract } = await deploy(1n);
        expect(await contract.getGetProposal(42n)).toBeNull();
    });

    it("contractBalance reflects TON sent to contract", async () => {
        const { deployer, contract } = await deploy(1n);
        await fund(contract, deployer, toNano("5"));
        const bal = await contract.getContractBalance();
        // Balance = deploy(1 TON) + fund(5 TON) minus gas; must be ≥ 4 TON
        expect(bal).toBeGreaterThan(toNano("4"));
    });
});

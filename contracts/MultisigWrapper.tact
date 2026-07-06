/*!
 * MultisigWrapper.tact
 *
 * 2-of-3 Multi-Signature Wrapper for Solaris CET Token governance.
 *
 * Governs:
 *  - DeDust pool liquidity additions / withdrawals
 *  - CET treasury transfers
 *
 * Architecture
 * ─────────────────────────────────────────────────────────────────────────────
 * Any of the 3 configured signers can PROPOSE a transaction.
 * The proposal is stored on-chain with an ID.
 * A second distinct signer must CONFIRM the proposal within EXPIRY_SECONDS.
 * Once threshold (2) is reached, the wrapped message is forwarded automatically.
 *
 * Immutable references
 *  CET Token contract : EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX
 *  DeDust LP pool     : EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB
 */

import "@stdlib/deploy";

// ── Constants ─────────────────────────────────────────────────────────────────

const THRESHOLD: Int = 2;           // Required confirmations (2-of-3)
const MAX_SIGNERS: Int = 3;         // Maximum signer count
const EXPIRY_SECONDS: Int = 86400;  // Proposal TTL: 24 hours

// ── Message types ─────────────────────────────────────────────────────────────

/// Propose a new governance transaction.
message(0x1001) Propose {
    /// Destination address for the forwarded message.
    destination: Address;
    /// TON value to forward (in nanoTON).
    value: Int as uint128;
    /// Serialised Cell payload to send to `destination`.
    payload: Cell?;
}

/// Confirm an existing proposal. Executes if threshold reached.
message(0x1002) Confirm {
    proposalId: Int as uint64;
}

/// Revoke a proposal (proposer only, before execution).
message(0x1003) Revoke {
    proposalId: Int as uint64;
}

// ── Storage ───────────────────────────────────────────────────────────────────

struct Proposal {
    destination: Address;
    value: Int as uint128;
    payload: Cell?;
    proposedAt: Int as uint64;
    /// Bitmask: bit i = signer index i has confirmed.
    confirmations: Int as uint8;
    executed: Bool;
    revoked: Bool;
}

// ── Contract ──────────────────────────────────────────────────────────────────

contract MultisigWrapper with Deployable {

    // Signer slots (fixed 3-of-3; 2-of-3 threshold applied at execution time)
    signer0: Address;
    signer1: Address;
    signer2: Address;

    // Proposal storage: proposal ID → Proposal
    proposals: map<Int, Proposal>;

    // Auto-incrementing proposal counter
    nextId: Int as uint64;

    // ── Constructor ───────────────────────────────────────────────────────────

    init(signer0: Address, signer1: Address, signer2: Address) {
        self.signer0 = signer0;
        self.signer1 = signer1;
        self.signer2 = signer2;
        self.nextId = 0;
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    fun signerIndex(addr: Address): Int {
        if (addr == self.signer0) { return 0; }
        if (addr == self.signer1) { return 1; }
        if (addr == self.signer2) { return 2; }
        return -1;
    }

    fun isSigner(addr: Address): Bool {
        return self.signerIndex(addr) >= 0;
    }

    fun countBits(mask: Int): Int {
        let count: Int = 0;
        let m: Int = mask;
        repeat(MAX_SIGNERS) {
            if (m & 1 == 1) {
                count = count + 1;
            }
            m = m >> 1;
        }
        return count;
    }

    // ── Receive: Propose ──────────────────────────────────────────────────────

    receive(msg: Propose) {
        let sender: Address = sender();
        let idx: Int = self.signerIndex(sender);
        require(idx >= 0, "Not a signer");

        let id: Int = self.nextId;
        self.nextId = id + 1;

        // Proposer automatically counts as first confirmation
        let confirmMask: Int = 1 << idx;

        self.proposals.set(id, Proposal{
            destination: msg.destination,
            value: msg.value,
            payload: msg.payload,
            proposedAt: now(),
            confirmations: confirmMask,
            executed: false,
            revoked: false,
        });
    }

    // ── Receive: Confirm ──────────────────────────────────────────────────────

    receive(msg: Confirm) {
        let sender: Address = sender();
        let idx: Int = self.signerIndex(sender);
        require(idx >= 0, "Not a signer");

        let p: Proposal? = self.proposals.get(msg.proposalId);
        require(p != null, "Proposal not found");

        let prop: Proposal = p!!;
        require(!prop.executed, "Already executed");
        require(!prop.revoked, "Proposal revoked");
        require(now() <= prop.proposedAt + EXPIRY_SECONDS, "Proposal expired");

        // Record confirmation (idempotent — bit already set means already confirmed)
        let bit: Int = 1 << idx;
        prop.confirmations = prop.confirmations | bit;

        if (self.countBits(prop.confirmations) >= THRESHOLD) {
            prop.executed = true;
            self.proposals.set(msg.proposalId, prop);

            // Forward the wrapped message
            if (prop.payload != null) {
                send(SendParameters{
                    to: prop.destination,
                    value: prop.value,
                    mode: SendIgnoreErrors,
                    body: prop.payload!!,
                });
            } else {
                send(SendParameters{
                    to: prop.destination,
                    value: prop.value,
                    mode: SendIgnoreErrors,
                });
            }
        } else {
            self.proposals.set(msg.proposalId, prop);
        }
    }

    // ── Receive: Revoke ───────────────────────────────────────────────────────

    receive(msg: Revoke) {
        let sender: Address = sender();
        require(self.isSigner(sender), "Not a signer");

        let p: Proposal? = self.proposals.get(msg.proposalId);
        require(p != null, "Proposal not found");

        let prop: Proposal = p!!;
        require(!prop.executed, "Already executed");
        require(!prop.revoked, "Already revoked");

        prop.revoked = true;
        self.proposals.set(msg.proposalId, prop);
    }

    // ── Getter: proposal info ─────────────────────────────────────────────────

    get fun getProposal(id: Int): Proposal? {
        return self.proposals.get(id);
    }

    get fun nextProposalId(): Int {
        return self.nextId;
    }

    get fun signers(): map<Int, Address> {
        let m: map<Int, Address> = emptyMap();
        m.set(0, self.signer0);
        m.set(1, self.signer1);
        m.set(2, self.signer2);
        return m;
    }
}

import "@stdlib/deploy";

// ─── Constants ────────────────────────────────────────────────────────────────

/// Maximum number of owners ever added (limits the 32-bit signBitmap)
const MAX_OWNERS: Int = 32;

/// Hard cap on in-flight proposals stored on-chain
const MAX_PROPOSALS: Int = 100;

/// Default time-to-live for a proposal (7 days in seconds)
const PROPOSAL_TTL: Int = 604800;

/// Minimum TON kept for rent after a transfer execution
const MIN_RESERVE: Int = ton("0.05");

// ─── Proposal kinds ───────────────────────────────────────────────────────────

const KIND_TRANSFER:         Int = 0;
const KIND_ADD_OWNER:        Int = 1;
const KIND_REMOVE_OWNER:     Int = 2;
const KIND_UPDATE_THRESHOLD: Int = 3;

// ─── Messages (inbound) ───────────────────────────────────────────────────────

/// Propose a TON transfer to `to` for `value` nanoTON with optional payload
message(0x01) Propose {
    queryId:  Int as uint64;
    to:       Address;
    value:    Int as coins;
    payload:  Cell?;
}

/// Sign an open proposal
message(0x02) Sign {
    queryId:    Int as uint64;
    proposalId: Int as uint64;
}

/// Execute a proposal that has collected enough signatures
message(0x03) Execute {
    queryId:    Int as uint64;
    proposalId: Int as uint64;
}

/// Revoke a previously given signature
message(0x04) Revoke {
    queryId:    Int as uint64;
    proposalId: Int as uint64;
}

/// Propose adding a new owner (subject to multisig approval)
message(0x10) ProposeAddOwner {
    queryId:  Int as uint64;
    newOwner: Address;
}

/// Propose removing an existing owner (subject to multisig approval)
message(0x11) ProposeRemoveOwner {
    queryId: Int as uint64;
    owner:   Address;
}

/// Propose changing the signing threshold (subject to multisig approval)
message(0x12) ProposeUpdateThreshold {
    queryId:      Int as uint64;
    newThreshold: Int as uint8;
}

// ─── Proposal struct ──────────────────────────────────────────────────────────

struct Proposal {
    kind:       Int as uint8;
    /// Target address (transfer recipient, add/remove owner address, or proposer for threshold changes)
    to:         Address;
    /// Transfer amount in nanoTON; reused as new threshold value for KIND_UPDATE_THRESHOLD
    value:      Int as coins;
    payload:    Cell?;
    proposer:   Address;
    /// Bitmask: bit (ownerIndex−1) is set when that owner has signed
    signBitmap: Int as uint32;
    signCount:  Int as uint8;
    executed:   Bool;
    expiry:     Int as uint64;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

contract MultiSigWrapper with Deployable {

    // ── Owner registry ───────────────────────────────────────────────────────
    /// address → 1-based owner index (absent = not an owner)
    ownerIndex:    map<Address, Int>;
    /// 1-based owner index → address (absent = slot is vacant / owner removed)
    ownerByIndex:  map<Int, Address>;
    /// Bitmask of active owner slots (bit (idx−1) set ↔ owner at index idx is active)
    ownerBitmap:   Int as uint32;
    /// Number of currently active owners
    ownerCount:    Int as uint8;
    /// Monotonically increasing counter; next owner slot to assign
    nextOwnerSlot: Int as uint8;

    // ── Governance ───────────────────────────────────────────────────────────
    threshold: Int as uint8;

    // ── Proposals ────────────────────────────────────────────────────────────
    proposals:     map<Int, Proposal>;
    proposalCount: Int as uint64;

    // ── Re-entrancy guard ────────────────────────────────────────────────────
    locked: Bool;

    // ─────────────────────────────────────────────────────────────────────────
    // Init
    // ─────────────────────────────────────────────────────────────────────────

    init(owner: Address, threshold: Int) {
        require(threshold >= 1, "Threshold must be >= 1");

        self.ownerCount = 1; // set before threshold check so the require uses the live value
        require(threshold <= self.ownerCount, "Threshold cannot exceed owner count");

        self.nextOwnerSlot = 1;
        self.threshold     = threshold;
        self.ownerBitmap   = 1; // bit 0 set for slot 1
        self.proposalCount = 0;
        self.locked        = false;

        self.ownerIndex.set(owner, 1);
        self.ownerByIndex.set(1, owner);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receive: plain TON deposit
    // ─────────────────────────────────────────────────────────────────────────

    receive() {}

    // ─────────────────────────────────────────────────────────────────────────
    // Receive: Propose transfer
    // ─────────────────────────────────────────────────────────────────────────

    receive(msg: Propose) {
        self.requireNotLocked();
        let ownerIdx: Int = self.requireOwner(sender());

        require(msg.value >= 0,                                    "Value must be non-negative");
        require(msg.value <= myBalance() - MIN_RESERVE,            "Insufficient contract balance");
        require(self.proposalCount < MAX_PROPOSALS,                "Too many open proposals");

        let bitmap: Int = self.setBit(0, ownerIdx);

        let p: Proposal = Proposal {
            kind:       KIND_TRANSFER,
            to:         msg.to,
            value:      msg.value,
            payload:    msg.payload,
            proposer:   sender(),
            signBitmap: bitmap,
            signCount:  1,
            executed:   false,
            expiry:     now() + PROPOSAL_TTL,
        };

        self.proposals.set(self.proposalCount, p);
        self.proposalCount = self.proposalCount + 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receive: Sign proposal
    // ─────────────────────────────────────────────────────────────────────────

    receive(msg: Sign) {
        self.requireNotLocked();
        let ownerIdx: Int = self.requireOwner(sender());

        let p: Proposal = self.requireProposal(msg.proposalId);
        require(!p.executed,               "Already executed");
        require(now() <= p.expiry,         "Proposal expired");
        require(!self.isBitSet(p.signBitmap, ownerIdx), "Already signed");

        p.signBitmap = self.setBit(p.signBitmap, ownerIdx);
        p.signCount  = p.signCount + 1;
        self.proposals.set(msg.proposalId, p);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receive: Execute proposal
    // ─────────────────────────────────────────────────────────────────────────

    receive(msg: Execute) {
        self.requireNotLocked();
        self.requireOwner(sender());

        let p: Proposal = self.requireProposal(msg.proposalId);
        require(!p.executed,          "Already executed");
        require(now() <= p.expiry,    "Proposal expired");

        // Re-evaluate valid signatures against current active-owner bitmap
        // (owners removed after signing no longer count)
        let validSigs: Int = self.countBits(p.signBitmap & self.ownerBitmap);
        require(validSigs >= self.threshold, "Insufficient valid signatures");

        // ── Check–Effects–Interactions ───────────────────────────────────────
        // Effects first (before any external interaction)
        self.locked   = true;
        p.executed    = true;
        self.proposals.set(msg.proposalId, p);

        // Interactions
        if (p.kind == KIND_TRANSFER) {
            require(p.value <= myBalance() - MIN_RESERVE, "Insufficient balance for transfer");
            send(SendParameters {
                to:    p.to,
                value: p.value,
                mode:  SendIgnoreErrors,
                body:  p.payload,
            });
        } else if (p.kind == KIND_ADD_OWNER) {
            self.internalAddOwner(p.to);
        } else if (p.kind == KIND_REMOVE_OWNER) {
            self.internalRemoveOwner(p.to);
        } else if (p.kind == KIND_UPDATE_THRESHOLD) {
            let t: Int = p.value;
            require(t >= 1,                  "Threshold too low");
            require(t <= self.ownerCount,    "Threshold exceeds owner count");
            self.threshold = t;
        }

        self.locked = false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receive: Revoke signature
    // ─────────────────────────────────────────────────────────────────────────

    receive(msg: Revoke) {
        self.requireNotLocked();
        let ownerIdx: Int = self.requireOwner(sender());

        let p: Proposal = self.requireProposal(msg.proposalId);
        require(!p.executed,          "Already executed");
        require(now() <= p.expiry,    "Proposal expired");
        require(self.isBitSet(p.signBitmap, ownerIdx), "Not signed");

        p.signBitmap = self.clearBit(p.signBitmap, ownerIdx);
        p.signCount  = p.signCount - 1;
        self.proposals.set(msg.proposalId, p);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receive: Propose add owner
    // ─────────────────────────────────────────────────────────────────────────

    receive(msg: ProposeAddOwner) {
        self.requireNotLocked();
        let ownerIdx: Int = self.requireOwner(sender());

        require(self.ownerCount < MAX_OWNERS,               "Max owners reached");
        require(self.nextOwnerSlot < MAX_OWNERS,            "No free owner slots");
        require(self.ownerIndex.get(msg.newOwner) == null,  "Already an owner");
        require(self.proposalCount < MAX_PROPOSALS,         "Too many open proposals");

        let bitmap: Int = self.setBit(0, ownerIdx);

        let p: Proposal = Proposal {
            kind:       KIND_ADD_OWNER,
            to:         msg.newOwner,
            value:      0,
            payload:    null,
            proposer:   sender(),
            signBitmap: bitmap,
            signCount:  1,
            executed:   false,
            expiry:     now() + PROPOSAL_TTL,
        };

        self.proposals.set(self.proposalCount, p);
        self.proposalCount = self.proposalCount + 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receive: Propose remove owner
    // ─────────────────────────────────────────────────────────────────────────

    receive(msg: ProposeRemoveOwner) {
        self.requireNotLocked();
        let ownerIdx: Int = self.requireOwner(sender());

        require(self.ownerIndex.get(msg.owner) != null, "Not an owner");
        require(self.ownerCount > self.threshold,       "Cannot remove: would break threshold");
        require(self.proposalCount < MAX_PROPOSALS,     "Too many open proposals");

        let bitmap: Int = self.setBit(0, ownerIdx);

        let p: Proposal = Proposal {
            kind:       KIND_REMOVE_OWNER,
            to:         msg.owner,
            value:      0,
            payload:    null,
            proposer:   sender(),
            signBitmap: bitmap,
            signCount:  1,
            executed:   false,
            expiry:     now() + PROPOSAL_TTL,
        };

        self.proposals.set(self.proposalCount, p);
        self.proposalCount = self.proposalCount + 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receive: Propose update threshold
    // ─────────────────────────────────────────────────────────────────────────

    receive(msg: ProposeUpdateThreshold) {
        self.requireNotLocked();
        let ownerIdx: Int = self.requireOwner(sender());

        require(msg.newThreshold >= 1,               "Threshold must be >= 1");
        require(msg.newThreshold <= self.ownerCount, "Threshold exceeds owner count");
        require(self.proposalCount < MAX_PROPOSALS,  "Too many open proposals");

        let bitmap: Int = self.setBit(0, ownerIdx);

        let p: Proposal = Proposal {
            kind:       KIND_UPDATE_THRESHOLD,
            to:         sender(), // placeholder
            value:      msg.newThreshold,
            payload:    null,
            proposer:   sender(),
            signBitmap: bitmap,
            signCount:  1,
            executed:   false,
            expiry:     now() + PROPOSAL_TTL,
        };

        self.proposals.set(self.proposalCount, p);
        self.proposalCount = self.proposalCount + 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    fun requireOwner(addr: Address): Int {
        let idx: Int? = self.ownerIndex.get(addr);
        require(idx != null, "Not an owner");
        return idx!!;
    }

    fun requireNotLocked() {
        require(!self.locked, "Re-entrancy detected");
    }

    fun requireProposal(id: Int): Proposal {
        let p: Proposal? = self.proposals.get(id);
        require(p != null, "Proposal not found");
        return p!!;
    }

    fun isBitSet(bitmap: Int, idx: Int): Bool {
        return ((bitmap >> (idx - 1)) & 1) == 1;
    }

    fun setBit(bitmap: Int, idx: Int): Int {
        return bitmap | (1 << (idx - 1));
    }

    fun clearBit(bitmap: Int, idx: Int): Int {
        return bitmap & ~(1 << (idx - 1));
    }

    /// Brian Kernighan's algorithm – O(set bits)
    fun countBits(n: Int): Int {
        let count: Int = 0;
        let x: Int     = n & 0xFFFFFFFF; // clamp to 32 bits
        while (x != 0) {
            x     = x & (x - 1);
            count = count + 1;
        }
        return count;
    }

    fun internalAddOwner(owner: Address) {
        let slot: Int = self.nextOwnerSlot + 1;
        self.nextOwnerSlot = slot;
        self.ownerBitmap   = self.setBit(self.ownerBitmap, slot);
        self.ownerIndex.set(owner, slot);
        self.ownerByIndex.set(slot, owner);
        self.ownerCount = self.ownerCount + 1;
    }

    fun internalRemoveOwner(owner: Address) {
        let idx: Int = self.ownerIndex.get(owner)!!;
        self.ownerBitmap = self.clearBit(self.ownerBitmap, idx);
        self.ownerByIndex.del(idx);
        self.ownerIndex.del(owner);
        self.ownerCount = self.ownerCount - 1;
        // Adjust threshold if it now exceeds the owner count
        if (self.threshold > self.ownerCount) {
            self.threshold = self.ownerCount;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Getters
    // ─────────────────────────────────────────────────────────────────────────

    get fun ownerCount(): Int       { return self.ownerCount; }
    get fun threshold(): Int        { return self.threshold; }
    get fun proposalCount(): Int    { return self.proposalCount; }
    get fun contractBalance(): Int  { return myBalance(); }

    get fun isOwner(addr: Address): Bool {
        return self.ownerIndex.get(addr) != null;
    }

    get fun getOwnerIndex(addr: Address): Int? {
        return self.ownerIndex.get(addr);
    }

    get fun getProposal(id: Int): Proposal? {
        return self.proposals.get(id);
    }

    get fun ownerBitmap(): Int {
        return self.ownerBitmap;
    }
}

import "@stdlib/deploy";

const YEAR_SECONDS: Int = 31536000;
const MIN_RESERVE: Int = ton("0.05");

message(0x01) Stake {
    queryId: Int as uint64;
    planId: Int as uint8;
}

message(0x02) Claim {
    queryId: Int as uint64;
}

message(0x03) Unstake {
    queryId: Int as uint64;
}

message(0x10) SetPlan {
    queryId: Int as uint64;
    planId: Int as uint8;
    durationSeconds: Int as uint32;
    apyBps: Int as uint16;
}

struct Plan {
    durationSeconds: Int as uint32;
    apyBps: Int as uint16;
}

struct Position {
    principal: Int as coins;
    planId: Int as uint8;
    lockEnd: Int as uint64;
    lastClaim: Int as uint64;
}

contract FixedStakingPool with Deployable {
    admin: Address;
    totalStaked: Int as coins;
    plans: map<Int, Plan>;
    positions: map<Address, Position>;

    init(admin: Address) {
        self.admin = admin;
        self.totalStaked = 0;
    }

    receive() {}

    receive(msg: SetPlan) {
        require(sender() == self.admin, "Unauthorized");
        require(msg.planId > 0, "Invalid planId");
        require(msg.durationSeconds > 0, "Invalid duration");
        self.plans.set(msg.planId, Plan{ durationSeconds: msg.durationSeconds, apyBps: msg.apyBps });
    }

    receive(msg: Stake) {
        require(msg.planId > 0, "Invalid planId");
        let planOpt: Plan? = self.plans.get(msg.planId);
        require(planOpt != null, "Unknown plan");
        let plan: Plan = planOpt!!;
        require(plan.durationSeconds > 0, "Plan disabled");

        let existing: Position? = self.positions.get(sender());
        if (existing != null) {
            require(existing!!.principal == 0, "Active position");
        }

        let amount: Int = context().value;
        require(amount > MIN_RESERVE, "Insufficient stake");

        let start: Int = now();
        let lockEnd: Int = start + plan.durationSeconds;
        self.positions.set(sender(), Position{ principal: amount, planId: msg.planId, lockEnd: lockEnd, lastClaim: start });
        self.totalStaked = self.totalStaked + amount;
    }

    receive(msg: Claim) {
        let pOpt: Position? = self.positions.get(sender());
        require(pOpt != null, "No position");
        let p: Position = pOpt!!;
        require(p.principal > 0, "No position");

        let planOpt: Plan? = self.plans.get(p.planId);
        require(planOpt != null, "Unknown plan");
        let plan: Plan = planOpt!!;

        let toTime: Int = now();
        if (toTime > p.lockEnd) {
            toTime = p.lockEnd;
        }
        let reward: Int = self.calcReward(p.principal, plan.apyBps, p.lastClaim, toTime);
        require(reward > 0, "Nothing to claim");
        require(reward <= myBalance() - MIN_RESERVE, "Insufficient rewards");

        p.lastClaim = toTime;
        self.positions.set(sender(), p);

        send(SendParameters{
            to: sender(),
            value: reward,
            mode: SendIgnoreErrors,
            body: null
        });
    }

    receive(msg: Unstake) {
        let pOpt: Position? = self.positions.get(sender());
        require(pOpt != null, "No position");
        let p: Position = pOpt!!;
        require(p.principal > 0, "No position");
        require(now() >= p.lockEnd, "Locked");

        let planOpt: Plan? = self.plans.get(p.planId);
        require(planOpt != null, "Unknown plan");
        let plan: Plan = planOpt!!;

        let reward: Int = self.calcReward(p.principal, plan.apyBps, p.lastClaim, p.lockEnd);
        let payout: Int = p.principal + reward;
        require(payout <= myBalance() - MIN_RESERVE, "Insufficient balance");

        self.totalStaked = self.totalStaked - p.principal;
        self.positions.set(sender(), Position{ principal: 0, planId: p.planId, lockEnd: p.lockEnd, lastClaim: p.lockEnd });

        send(SendParameters{
            to: sender(),
            value: payout,
            mode: SendIgnoreErrors,
            body: null
        });
    }

    fun calcReward(principal: Int, apyBps: Int, fromTime: Int, toTime: Int): Int {
        if (toTime <= fromTime) {
            return 0;
        }
        let elapsed: Int = toTime - fromTime;
        let denom: Int = 10000 * YEAR_SECONDS;
        return (principal * apyBps * elapsed) / denom;
    }

    get fun totalStaked(): Int {
        return self.totalStaked;
    }

    get fun planDurationSeconds(planId: Int): Int {
        let p: Plan? = self.plans.get(planId);
        if (p == null) {
            return 0;
        }
        return p!!.durationSeconds;
    }

    get fun planApyBps(planId: Int): Int {
        let p: Plan? = self.plans.get(planId);
        if (p == null) {
            return 0;
        }
        return p!!.apyBps;
    }

    get fun principalOf(addr: Address): Int {
        let p: Position? = self.positions.get(addr);
        if (p == null) {
            return 0;
        }
        return p!!.principal;
    }

    get fun lockEndOf(addr: Address): Int {
        let p: Position? = self.positions.get(addr);
        if (p == null) {
            return 0;
        }
        return p!!.lockEnd;
    }

    get fun pendingReward(addr: Address): Int {
        let pOpt: Position? = self.positions.get(addr);
        if (pOpt == null) {
            return 0;
        }
        let p: Position = pOpt!!;
        if (p.principal == 0) {
            return 0;
        }
        let planOpt: Plan? = self.plans.get(p.planId);
        if (planOpt == null) {
            return 0;
        }
        let plan: Plan = planOpt!!;
        let toTime: Int = now();
        if (toTime > p.lockEnd) {
            toTime = p.lockEnd;
        }
        return self.calcReward(p.principal, plan.apyBps, p.lastClaim, toTime);
    }
}


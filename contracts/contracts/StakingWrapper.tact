import "@stdlib/deploy";

message(0x01) Stake {
    queryId: Int as uint64;
    amount: Int as coins;
}

message(0x02) Unstake {
    queryId: Int as uint64;
    shares: Int as coins;
}

struct UserPosition {
    shares: Int as coins;
}

contract StakingWrapper with Deployable {
    totalStaked: Int as coins;
    totalShares: Int as coins;
    user: map<Address, UserPosition>;

    init() {
        self.totalStaked = 0;
        self.totalShares = 0;
    }

    receive() {}

    receive(msg: Stake) {
        require(msg.amount > 0, "Amount must be > 0");
        let shares: Int = msg.amount;
        if (self.totalShares > 0 && self.totalStaked > 0) {
            shares = (msg.amount * self.totalShares) / self.totalStaked;
        }
        require(shares > 0, "Shares must be > 0");

        let existing: UserPosition? = self.user.get(sender());
        let p: UserPosition = UserPosition{ shares: 0 };
        if (existing != null) {
            p = existing!!;
        }
        p.shares = p.shares + shares;
        self.user.set(sender(), p);

        self.totalStaked = self.totalStaked + msg.amount;
        self.totalShares = self.totalShares + shares;
    }

    receive(msg: Unstake) {
        require(msg.shares > 0, "Shares must be > 0");
        require(self.totalShares > 0 && self.totalStaked > 0, "Empty pool");

        let existing: UserPosition? = self.user.get(sender());
        let p: UserPosition = UserPosition{ shares: 0 };
        if (existing != null) {
            p = existing!!;
        }
        require(p.shares >= msg.shares, "Insufficient shares");

        let amount: Int = (msg.shares * self.totalStaked) / self.totalShares;
        p.shares = p.shares - msg.shares;
        self.user.set(sender(), p);

        self.totalStaked = self.totalStaked - amount;
        self.totalShares = self.totalShares - msg.shares;
    }

    get fun totalStaked(): Int {
        return self.totalStaked;
    }

    get fun totalShares(): Int {
        return self.totalShares;
    }

    get fun sharesOf(addr: Address): Int {
        let p: UserPosition? = self.user.get(addr);
        if (p == null) {
            return 0;
        }
        return p!!.shares;
    }
}

import "@stdlib/deploy";

message(0x01) VerifyKYC {
    queryId: Int as uint64;
    user: Address;
}

message(0x02) SetConsent {
    queryId: Int as uint64;
    consent: Bool;
}

message(0x03) ProposeAdmin {
    queryId: Int as uint64;
    newAdmin: Address;
}

message(0x04) AcceptAdmin {
    queryId: Int as uint64;
}

struct UserFlags {
    kycVerified: Bool;
    dataConsent: Bool;
    lastUpdated: Int as uint64;
}

contract Compliance with Deployable {
    admin: Address;
    pendingAdmin: Address?;
    users: map<Address, UserFlags>;

    init(admin: Address) {
        self.admin = admin;
        self.pendingAdmin = null;
    }

    receive() {}

    receive(msg: VerifyKYC) {
        require(sender() == self.admin, "Only admin");
        let existing: UserFlags? = self.users.get(msg.user);
        let u: UserFlags = UserFlags{ kycVerified: false, dataConsent: false, lastUpdated: 0 };
        if (existing != null) {
            u = existing!!;
        }
        u.kycVerified = true;
        u.lastUpdated = now();
        self.users.set(msg.user, u);
    }

    receive(msg: ProposeAdmin) {
        require(sender() == self.admin, "Only admin");
        require(msg.newAdmin != self.admin, "No-op admin");
        self.pendingAdmin = msg.newAdmin;
    }

    receive(msg: AcceptAdmin) {
        require(self.pendingAdmin != null, "No pending admin");
        require(sender() == self.pendingAdmin!!, "Only pending admin");
        self.admin = sender();
        self.pendingAdmin = null;
    }

    receive(msg: SetConsent) {
        let existing: UserFlags? = self.users.get(sender());
        let u: UserFlags = UserFlags{ kycVerified: false, dataConsent: false, lastUpdated: 0 };
        if (existing != null) {
            u = existing!!;
        }
        u.dataConsent = msg.consent;
        u.lastUpdated = now();
        self.users.set(sender(), u);
    }

    get fun admin(): Address {
        return self.admin;
    }

    get fun pendingAdmin(): Address? {
        return self.pendingAdmin;
    }

    get fun isCompliant(user: Address): Bool {
        let u: UserFlags? = self.users.get(user);
        if (u == null) {
            return false;
        }
        return u!!.kycVerified && u!!.dataConsent;
    }
}

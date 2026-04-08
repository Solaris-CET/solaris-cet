import "@stdlib/deploy";

message(0x01) VerifyKYC {
    queryId: Int as uint64;
    user: Address;
}

message(0x02) SetConsent {
    queryId: Int as uint64;
    consent: Bool;
}

struct UserFlags {
    kycVerified: Bool;
    dataConsent: Bool;
    lastUpdated: Int as uint64;
}

contract Compliance with Deployable {
    admin: Address;
    users: map<Address, UserFlags>;

    init(admin: Address) {
        self.admin = admin;
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

    get fun isCompliant(user: Address): Bool {
        let u: UserFlags? = self.users.get(user);
        if (u == null) {
            return false;
        }
        return u!!.kycVerified && u!!.dataConsent;
    }
}

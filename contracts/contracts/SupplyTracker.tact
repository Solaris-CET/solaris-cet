import "@stdlib/deploy";

message(0x01) UpdateSupply {
    queryId: Int as uint64;
    totalSupply: Int as coins;
}

message(0x02) ProposeAdmin {
    queryId: Int as uint64;
    newAdmin: Address;
}

message(0x03) AcceptAdmin {
    queryId: Int as uint64;
}

contract SupplyTracker with Deployable {
    admin: Address;
    pendingAdmin: Address?;
    maxSupply: Int as coins;
    totalSupply: Int as coins;

    init(admin: Address) {
        self.admin = admin;
        self.pendingAdmin = null;
        self.maxSupply = 9000;
        self.totalSupply = 0;
    }

    receive() {}

    receive(msg: UpdateSupply) {
        require(sender() == self.admin, "Only admin");
        require(msg.totalSupply >= 0, "Invalid supply");
        require(msg.totalSupply <= self.maxSupply, "Supply exceeded");
        self.totalSupply = msg.totalSupply;
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

    get fun admin(): Address {
        return self.admin;
    }

    get fun pendingAdmin(): Address? {
        return self.pendingAdmin;
    }

    get fun supply(): Int {
        return self.totalSupply;
    }

    get fun maxSupply(): Int {
        return self.maxSupply;
    }
}

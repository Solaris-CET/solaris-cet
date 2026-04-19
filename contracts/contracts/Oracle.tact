import "@stdlib/deploy";

message(0x01) UpdatePrice {
    queryId: Int as uint64;
    newPrice: Int as coins;
}

message(0x02) ProposeAdmin {
    queryId: Int as uint64;
    newAdmin: Address;
}

message(0x03) AcceptAdmin {
    queryId: Int as uint64;
}

contract Oracle with Deployable {
    admin: Address;
    pendingAdmin: Address?;
    price: Int as coins;
    lastUpdate: Int as uint64;

    init(admin: Address) {
        self.admin = admin;
        self.pendingAdmin = null;
        self.price = 0;
        self.lastUpdate = 0;
    }

    receive() {}

    receive(msg: UpdatePrice) {
        require(sender() == self.admin, "Only admin");
        require(msg.newPrice >= 0, "Invalid price");
        self.price = msg.newPrice;
        self.lastUpdate = now();
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

    get fun price(): Int {
        return self.price;
    }

    get fun lastUpdate(): Int {
        return self.lastUpdate;
    }
}

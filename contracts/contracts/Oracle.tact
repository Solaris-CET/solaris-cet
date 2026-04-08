import "@stdlib/deploy";

message(0x01) UpdatePrice {
    queryId: Int as uint64;
    newPrice: Int as coins;
}

contract Oracle with Deployable {
    admin: Address;
    price: Int as coins;
    lastUpdate: Int as uint64;

    init(admin: Address) {
        self.admin = admin;
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

    get fun price(): Int {
        return self.price;
    }

    get fun lastUpdate(): Int {
        return self.lastUpdate;
    }
}

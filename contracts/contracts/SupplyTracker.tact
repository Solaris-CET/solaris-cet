import "@stdlib/deploy";

message(0x01) UpdateSupply {
    queryId: Int as uint64;
    totalSupply: Int as coins;
}

contract SupplyTracker with Deployable {
    admin: Address;
    maxSupply: Int as coins;
    totalSupply: Int as coins;

    init(admin: Address) {
        self.admin = admin;
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

    get fun supply(): Int {
        return self.totalSupply;
    }

    get fun maxSupply(): Int {
        return self.maxSupply;
    }
}

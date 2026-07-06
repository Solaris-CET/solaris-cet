import "@stdlib/deploy";

message(0x52324101) R2ASubmit {
    queryId: Int as uint64;
    complexity: Int as uint8;
    hoursScaled: Int as uint32;
    stakeNanoCET: Int as coins;
    submitter: Address;
    contentHash: Int as uint256;
}

message(0x7362d09c) JettonTransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice;
}

struct TaskSubmission {
    submitter: Address;
    complexity: Int as uint8;
    hoursScaled: Int as uint32;
    stakeNanoCET: Int as coins;
    contentHash: Int as uint256;
    createdAt: Int as uint64;
}

contract R2ATaskBoard with Deployable {
    admin: Address;
    submissions: map<Int, TaskSubmission>;
    submissionCount: Int as uint32;

    init(admin: Address) {
        self.admin = admin;
        self.submissionCount = 0;
    }

    receive() {}

    fun storeSubmission(queryId: Int, submitter: Address, complexity: Int, hoursScaled: Int, stakeNanoCET: Int, contentHash: Int) {
        require(complexity >= 1 && complexity <= 4, "Invalid complexity");
        require(hoursScaled > 0, "Invalid hours");
        require(stakeNanoCET > 0, "Invalid stake");
        require(self.submissions.get(queryId) == null, "Duplicate");
        self.submissions.set(
            queryId,
            TaskSubmission{
                submitter: submitter,
                complexity: complexity,
                hoursScaled: hoursScaled,
                stakeNanoCET: stakeNanoCET,
                contentHash: contentHash,
                createdAt: now()
            }
        );
        self.submissionCount = self.submissionCount + 1;
    }

    receive(msg: R2ASubmit) {
        self.storeSubmission(msg.queryId, msg.submitter, msg.complexity, msg.hoursScaled, msg.stakeNanoCET, msg.contentHash);
    }

    receive(msg: JettonTransferNotification) {
        let fp: Slice = msg.forwardPayload;
        let op: Int = fp.loadUint(32);
        require(op == 0x52324101, "Invalid payload");
        let queryId: Int = fp.loadUint(64);
        let complexity: Int = fp.loadUint(8);
        let hoursScaled: Int = fp.loadUint(32);
        let stakeNanoCET: Int = fp.loadCoins();
        let submitter: Address = fp.loadAddress();
        let contentHash: Int = fp.loadUint(256);
        require(queryId == msg.queryId, "Query mismatch");
        require(stakeNanoCET == msg.amount, "Amount mismatch");
        require(submitter == msg.sender, "Sender mismatch");
        self.storeSubmission(queryId, submitter, complexity, hoursScaled, stakeNanoCET, contentHash);
    }

    get fun admin(): Address {
        return self.admin;
    }

    get fun submissionCount(): Int {
        return self.submissionCount;
    }

    get fun submission(queryId: Int): TaskSubmission? {
        return self.submissions.get(queryId);
    }
}

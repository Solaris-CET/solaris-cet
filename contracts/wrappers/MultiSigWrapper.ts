// Re-export all types and the contract class from the Tact-compiled output.
// This file is the public API for tests and deployment scripts.
export {
    MultiSigWrapper,
    type Proposal,
    type Propose,
    type Sign,
    type Execute,
    type Revoke,
    type ProposeAddOwner,
    type ProposeRemoveOwner,
    type ProposeUpdateThreshold,
    storePropose,
    storeSign,
    storeExecute,
    storeRevoke,
    storeProposeAddOwner,
    storeProposeRemoveOwner,
    storeProposeUpdateThreshold,
} from "../build/MultiSigWrapper/tact_MultiSigWrapper";

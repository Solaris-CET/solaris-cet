import { toNano, Address } from "@ton/core";
import { MultiSigWrapper } from "../wrappers/MultiSigWrapper";
import { NetworkProvider } from "@ton/blueprint";

/**
 * Deployment script for MultiSigWrapper.
 *
 * Usage:
 *   npx blueprint run deployMultiSigWrapper --network testnet
 *
 * Environment variables:
 *   OWNER   – deployer address used as the initial single owner (defaults to
 *             the wallet connected via the network provider).
 */
export async function run(provider: NetworkProvider) {
    const sender = provider.sender();

    if (!sender.address) {
        throw new Error("Sender address is not available. Please connect a wallet.");
    }

    const owner: Address = sender.address;
    const threshold = 1n; // start with 1-of-1; add owners and raise threshold afterwards

    console.log(`Deploying MultiSigWrapper with owner: ${owner.toString()}`);
    console.log(`Initial threshold: ${threshold}`);

    const contract = provider.open(
        await MultiSigWrapper.fromInit(owner, threshold)
    );

    await contract.send(
        sender,
        { value: toNano("0.2") }, // initial TON for rent
        { $$type: "Deploy", queryId: 0n }
    );

    await provider.waitForDeploy(contract.address);

    console.log("✅ MultiSigWrapper deployed at:", contract.address.toString());
    console.log("   Owner count :", (await contract.getOwnerCount()).toString());
    console.log("   Threshold   :", (await contract.getThreshold()).toString());
}

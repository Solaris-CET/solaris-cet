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
 *   OWNER   – optional deployer address used as the initial single owner.
 *             Defaults to the wallet connected via the network provider when
 *             not set or empty. Must be a valid TON address if provided.
 */
export async function run(provider: NetworkProvider) {
    const sender = provider.sender();

    // Resolve owner address: prefer OWNER env var, fall back to connected sender.
    let owner: Address;
    const envOwner = process.env.OWNER;
    if (envOwner && envOwner.trim().length > 0) {
        try {
            owner = Address.parse(envOwner.trim());
        } catch (error) {
            throw new Error(
                `Invalid OWNER environment variable value "${envOwner}". ` +
                "Please provide a valid TON address (e.g. EQ... or UQ...)."
            );
        }
    } else {
        if (!sender.address) {
            throw new Error(
                "Sender address is not available. " +
                "Please connect a wallet or set the OWNER environment variable."
            );
        }
        owner = sender.address;
    }

    const threshold = 1n; // start with 1-of-1; add owners and raise threshold afterwards

    console.log(`Deploying MultiSigWrapper:`);
    console.log(`  Initial owner : ${owner.toString()}`);
    console.log(`  Threshold     : ${threshold}-of-1`);

    const contract = provider.open(
        await MultiSigWrapper.fromInit(owner, threshold)
    );

    await contract.send(
        sender,
        { value: toNano("0.05") },
        { $$type: "Deploy", queryId: 0n }
    );

    await provider.waitForDeploy(contract.address);

    console.log(`MultiSigWrapper deployed to: ${contract.address.toString()}`);
}

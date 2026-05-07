import { toNano, Address } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";

import { R2ATaskBoard } from "../wrappers/R2ATaskBoard";

/**
 * Deployment script for R2ATaskBoard.
 *
 * Usage:
 *   npx blueprint run deployR2ATaskBoard --network mainnet
 *
 * Environment variables:
 *   ADMIN – optional admin address for the contract. Defaults to the connected sender.
 */
export async function run(provider: NetworkProvider) {
  const sender = provider.sender();

  let admin: Address;
  const envAdmin = process.env.ADMIN;
  if (envAdmin && envAdmin.trim().length > 0) {
    admin = Address.parse(envAdmin.trim());
  } else {
    if (!sender.address) {
      throw new Error("Sender address is not available. Please connect a wallet or set ADMIN.");
    }
    admin = sender.address;
  }

  console.log(`Deploying R2ATaskBoard:`);
  console.log(`  Admin: ${admin.toString()}`);

  const contract = provider.open(await R2ATaskBoard.fromInit(admin));

  await contract.send(sender, { value: toNano("0.08") }, { $$type: "Deploy", queryId: 0n });
  await provider.waitForDeploy(contract.address);

  console.log(`R2ATaskBoard deployed to: ${contract.address.toString()}`);
}


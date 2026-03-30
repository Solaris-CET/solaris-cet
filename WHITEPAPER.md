# Solaris CET — Institutional Whitepaper v2.0

**The Architecture of Absolute Scarcity and Decentralized Governance on The Open Network**

---

> *"Scarcity, when paired with utility and cryptographic immutability, transforms a token into a protocol-level primitive."*

---

## 1. Executive Summary

Solaris CET represents a paradigm shift in the design philosophy of decentralized governance tokens deployed on The Open Network (TON). At a time when the broader Web3 landscape is saturated with inflationary tokenomics, exploitable multi-sig structures, and opaque treasury management, Solaris CET is architected from first principles around three inviolable axioms: absolute supply constraint, cryptographically enforced treasury security, and community-sovereign governance. With a total supply permanently fixed at **9,000 CET** — a figure that will never increase due to irrevocably renounced minting authority — the protocol establishes a foundational scarcity model that positions CET as a genuinely deflationary asset in a sea of perpetually diluted governance tokens.

The technical infrastructure underpinning Solaris CET is purpose-built for the TON blockchain's unique asynchronous, actor-based execution environment. The Jetton Master Contract (`EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX`), implemented in strict conformance with the TEP-74 Fungible Token Standard, governs all on-chain token operations. Treasury custody is entrusted exclusively to a Wallet V5 R1 multi-signature address (`UQDUP2y5HBR1tRA3cZ6spDl2PV-KE2Wts_To5JTQQEf2favu`), which enforces multi-party authorization for every outbound treasury transaction, eliminating the single-point-of-failure vulnerabilities that have historically plagued DAO treasuries across Ethereum, Solana, and BNB Chain ecosystems.

The Solaris ecosystem is not merely a token; it is a governance primitive. CET holders exercise proportional sovereignty over protocol direction, treasury allocation, and ecosystem expansion through a formalized on-chain proposal lifecycle executed via the V5 R1 multi-sig mechanism. By anchoring liquidity discovery to the USDT/CET pair on DeDust.io's Automated Market Maker, Solaris CET provides transparent, manipulation-resistant price discovery governed by a constant-product invariant. This whitepaper provides a comprehensive technical, economic, and governance specification for institutional participants, independent auditors, and the broader TON developer community.

---

## 2. The Problem Statement

### 2.1 The Inflation Trap in Contemporary Web3 Tokenomics

The dominant paradigm in Web3 token design has historically been one of programmatic inflation. Protocols justify continuous token minting through liquidity mining incentives, staking rewards, validator compensation, and ecosystem grants — mechanisms that, while temporarily stimulating participation metrics, fundamentally erode the purchasing power of all existing holders over time. The result is a structural wealth transfer from passive long-term holders to early participants and protocol insiders who can sell newly minted tokens into the market faster than organic demand can absorb them. This inflationary design creates an asymmetric game where the only rational strategy is continuous selling, undermining the long-term value accrual that genuine governance utility requires. Solaris CET categorically rejects this model.

### 2.2 Centralization Risks and Treasury Vulnerabilities

A second systemic failure mode in the current DeFi governance landscape is the prevalence of single-signature treasury controls. Across hundreds of deployed DAO protocols, a single compromised private key — whether through phishing, a supply-chain attack on a dependency, or physical coercion — has been sufficient to drain entire community treasuries. High-profile exploits on Ethereum-based DAOs have resulted in losses exceeding hundreds of millions of dollars, and the victims in every case were the token holders who had delegated custody of community funds to an insufficiently secured wallet. The centralization risk is not merely technical; it is organizational. Many protocols nominally describe themselves as "decentralized" while concentrating executive treasury authority in two or three individuals with unilateral signing power.

### 2.3 Volatility of Non-Stablecoin Liquidity Pairs

A third structural problem afflicting nascent governance tokens is liquidity bootstrapped against highly volatile base assets such as ETH, BNB, or SOL. When a token's only trading pair is denominated in a volatile asset, price discovery becomes doubly complex: the quoted price of the governance token is a function of both its own adoption curve and the often-uncorrelated volatility of the base asset. This introduces unnecessary risk for participants who wish to acquire governance exposure without speculative exposure to the base layer asset. Solaris CET addresses this by anchoring its primary liquidity exclusively to USDT — a fiat-collateralized stablecoin — on the DeDust.io AMM, ensuring that CET price discovery reflects genuine market conviction about Solaris governance utility rather than correlated movements in TON's native asset price.

---

## 3. The Solaris Solution & Architecture

### 3.1 TON Asynchronous Smart Contracts and the Actor Model

The Open Network (TON) is built upon a sharded, asynchronous smart contract architecture fundamentally different from the synchronous execution environment of Ethereum's EVM. In TON, every smart contract is an independent *actor* — an isolated computational entity with its own state, balance, and message queue. Contracts communicate exclusively through asynchronous messages; there are no synchronous external calls, no re-entrancy attack surfaces, and no global execution halts. This architecture enables TON to process millions of transactions per second through horizontal sharding while maintaining deterministic state finality.

Solaris CET leverages this actor model by deploying its Jetton Master Contract and individual Jetton Wallet contracts as discrete, isolated actors. When a user initiates a CET transfer, the Jetton Wallet contract of the sender dispatches an asynchronous internal message to the recipient's Jetton Wallet contract. The Master Contract (`EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX`) serves as the canonical authority for total supply tracking, minting authorization (permanently revoked), and Jetton Wallet code deployment. This actor-isolated design means that a flaw in one user's Jetton Wallet cannot propagate state corruption to other wallets or to the Master Contract itself — a security property that is structurally impossible to achieve in synchronous EVM environments.

### 3.2 V5 R1 Multi-Signature Treasury Vault

The treasury and administrative address (`UQDUP2y5HBR1tRA3cZ6spDl2PV-KE2Wts_To5JTQQEf2favu`) is instantiated as a TON Wallet V5 R1 contract — the most current and cryptographically hardened wallet specification in the TON ecosystem. The V5 R1 standard introduces several security improvements over legacy wallet versions, including support for extended action lists, gas optimization for complex transaction bundles, and most critically for institutional treasury management, native compatibility with multi-party signature schemes.

In the Solaris operational security model, no treasury disbursement — whether for ecosystem grants, DEX liquidity additions, marketing expenditure, or protocol development funding — can be executed without the cryptographic co-authorization of multiple designated keyholders. Each proposed transaction is first constructed as an unsigned payload, distributed to all authorized signatories through an out-of-band secure channel, and only broadcast to the TON network after the required signature threshold has been collected and aggregated. This means that even if an adversary were to fully compromise one keyholder's device, private key material, and operational security setup, they would remain entirely incapable of unilaterally executing a treasury transaction. The multi-sig threshold enforces a consensus requirement at the cryptographic layer — not the social layer — making it impervious to social engineering attacks directed at individual team members. The treasury address is publicly auditable on-chain; any observer can verify the balance, inbound transfers, and the multi-sig authorization records for every outbound transaction in real time.

### 3.3 Jetton Standard (TEP-74) Technical Implementation

The Solaris CET token is implemented in strict conformance with **TEP-74**, the canonical Fungible Token (Jetton) standard for the TON blockchain. TEP-74 defines a two-contract architecture: a *Jetton Master* contract that maintains global metadata (name, symbol, decimals, total supply, and the Jetton Wallet code hash) and individual *Jetton Wallet* contracts deployed per user address that maintain personal balances.

The Master Contract (`EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX`) exposes the following standardized operations:

- **`get_jetton_data`**: Returns total supply (9,000 CET), mintable flag (permanently set to `false`), admin address (treasury multi-sig), content cell (on-chain metadata URI), and Jetton Wallet code cell.
- **`get_wallet_address`**: Given an owner address, deterministically computes and returns the associated Jetton Wallet contract address.
- **`mint` (disabled)**: The minting operation is permanently disabled. The `mintable` flag in the contract state has been set to `false` and the admin address has been set to a burn address, ensuring that no future call — regardless of the caller — can increase the total supply beyond 9,000 CET.

Individual Jetton Wallet contracts implement the `transfer` and `burn` operations. The `transfer` operation dispatches an `internal_transfer` message to the recipient's Jetton Wallet, which credits the recipient's balance atomically within the same shard. Burn operations reduce a wallet's balance and send a notification to the Master Contract to decrease the recorded total supply accordingly, providing an additional supply-reduction mechanism available to any holder who wishes to permanently remove their CET from circulation.

---

## 4. Tokenomics & Mathematical Models

### 4.1 Supply Distribution

The total supply of 9,000 CET is allocated across three functional categories designed to balance immediate market liquidity, long-term governance incentivization, and ecosystem development sustainability.

| Allocation Category              | CET Amount | Percentage | Vesting / Unlock Schedule                  |
|----------------------------------|-----------|------------|---------------------------------------------|
| DEX Liquidity (DeDust USDT/CET)  | 4,500 CET | 50.00%     | Immediately deployed at genesis             |
| Treasury / Governance Reserve    | 3,150 CET | 35.00%     | Multi-sig controlled; released via DAO vote |
| Community Incentives & Ecosystem | 1,350 CET | 15.00%     | Distributed per governance-approved grants  |

The DEX liquidity allocation constitutes exactly half of total supply, ensuring deep initial liquidity depth relative to market capitalization and minimizing price impact for institutional-scale entries. The Treasury/Governance Reserve, custodied in the V5 R1 multi-sig vault, is the primary instrument of protocol longevity — funding audits, integrations, exchange listings, and developer grants exclusively through DAO-approved proposals. The Community Incentives allocation provides the governance body with a dedicated pool for rewarding ecosystem contributors, dApp developers, and long-term holders who actively participate in governance.

### 4.2 Deflationary Mechanics and Value Scaling

With minting permanently and irrevocably renounced, the Solaris CET supply function is strictly monotonically non-increasing. Total circulating supply can only remain constant or decrease — never increase. As holders exercise the optional burn operation, circulating supply decreases further, concentrating governance power and economic value among remaining holders.

The economic intuition is straightforward: if we model Solaris CET value as a function of network utility *U* and circulating supply *S*, then:

$$V_{CET} = \frac{U(t)}{S(t)}$$

Where *U(t)* is a monotonically increasing function of ecosystem adoption, integrations, and governance activity over time, and *S(t)* is a monotonically non-increasing function of total circulating supply. Both derivatives act in the same direction — increasing *U* and decreasing *S* both increase *V*. This creates a uniquely favorable long-term value trajectory absent from inflationary governance tokens where *S(t)* grows unboundedly.

### 4.3 DeDust Constant Product AMM and Price Discovery

Solaris CET's primary liquidity is provided through DeDust.io's Automated Market Maker, which implements the well-established **constant product invariant**:

$$x \cdot y = k$$

Where:
- $x$ is the USDT reserve held in the liquidity pool
- $y$ is the CET reserve held in the liquidity pool
- $k$ is the constant invariant, maintained by the AMM at all times

The **spot price** of CET denominated in USDT is derived from the ratio of reserves:

$$P_{CET} = \frac{x}{y}$$

When a buyer swaps USDT for CET, they add $\Delta x$ USDT to the pool and withdraw $\Delta y$ CET, subject to the invariant constraint $(x + \Delta x)(y - \Delta y) = k$. This produces the execution price:

$$\Delta y = y - \frac{k}{x + \Delta x}$$

The constant product model ensures that price impact scales with trade size relative to pool depth — larger trades move the price more, creating a natural economic disincentive for manipulation while guaranteeing continuous liquidity at all price levels. Because the base asset is USDT (a stablecoin), the CET price reflects purely the market's assessment of CET utility, uncorrupted by base asset volatility.

---

## 5. Ecosystem Utility & DAO Governance

### 5.1 CET as Weighted Voting Power

Every CET token in a holder's Jetton Wallet represents one unit of governance voting power. The Solaris governance model uses a linear weighting function: a holder controlling 450 CET (5% of total supply) exercises exactly 5% of total governance weight on any proposal. There is no vote locking, no quadratic weighting, and no delegation proxy — governance is direct, transparent, and proportional to genuine economic commitment to the ecosystem.

This linear model is deliberately chosen to avoid the complexity and potential gaming vectors of quadratic voting systems (where coordination among small holders can artificially amplify influence) and to reward long-term holders who concentrate positions as genuine believers in protocol direction rather than transient participants. The on-chain verifiability of Jetton Wallet balances at any given block height means that governance participation is fully auditable and cannot be fraudulently inflated.

### 5.2 The Solaris Governance Proposal Lifecycle

Every governance action within the Solaris ecosystem follows a rigorous, multi-stage proposal lifecycle designed to balance deliberative democratic process with operational agility.

**Stage 1 — Community Draft:**
Any holder of a minimum threshold of CET may submit a formal governance proposal to the designated Solaris governance forum. The draft must specify: the precise action requested (treasury disbursement amount and recipient, protocol parameter change, ecosystem integration approval, etc.), the strategic rationale, expected outcomes, and any supporting technical specifications. The community draft phase lasts a minimum of **72 hours**, during which any holder may submit commentary, request clarifications, or propose amendments.

**Stage 2 — Snapshot Vote:**
Upon completion of the draft phase, qualified proposals advance to an off-chain snapshot vote. The snapshot captures all CET Jetton Wallet balances at a specific TON block height, establishing a tamper-proof record of voting weight for each participating address. Voting windows remain open for a minimum of **5 days**, with results published transparently. A proposal passes the snapshot stage if it achieves a simple majority (>50%) of participating voting weight, with a minimum quorum of **10% of circulating supply** participating.

**Stage 3 — On-Chain Execution via V5 R1 Multi-Sig:**
Proposals that pass the snapshot vote are queued for on-chain execution. The V5 R1 multi-sig treasury signatories construct the corresponding on-chain transaction payload, verify its conformance with the approved proposal text, collect the required cryptographic co-signatures, and broadcast the transaction to the TON network. All execution transactions are publicly visible on-chain, providing a permanent, immutable audit trail linking every treasury disbursement to its authorizing governance vote. No treasury action may be executed outside this lifecycle; attempts to bypass the governance process are cryptographically prevented by the multi-sig threshold requirement.

---

## 6. Roadmap (2026 – 2027)

### Q3 2026 — Market Presence & Metadata Verification

The primary objective of Q3 2026 is the formal establishment of Solaris CET's presence on the canonical cryptocurrency data aggregators. This quarter targets successful listing applications to **CoinMarketCap (CMC)** and **CoinGecko (CG)**, including submission of all required metadata: contract address verification, team information disclosure, project description, official website and social media links, and circulating supply attestation. Concurrently, the Solaris team will pursue on-chain metadata verification through TON's official token registry, ensuring that CET displays with correct name, symbol, decimal precision, and logo in all major TON-compatible wallets including Tonkeeper, MyTonWallet, and the TON Space browser extension. DeDust.io pool verification and analytics integration will also be completed this quarter, enabling accurate TVL tracking and trading volume reporting.

### Q4 2026 — Governance Dashboard UI

With on-chain infrastructure established and CET broadly listed, Q4 2026 focuses on delivering the **Solaris Governance Dashboard** — a purpose-built web application providing CET holders with a seamless, non-custodial interface for full governance participation. Core dashboard features will include: real-time on-chain portfolio and voting power display, proposal submission and commentary interface, snapshot vote participation with TonConnect wallet integration, and a transparent treasury analytics panel displaying all multi-sig outbound transactions mapped to their originating governance proposals. The dashboard will be deployed as a fully static, IPFS-pinned frontend to ensure censorship resistance and perpetual availability. This quarter also targets the completion of a formal smart contract security audit by a recognized third-party auditor, with the full audit report published publicly.

### Q1 2027 — Secondary DEX Pool Expansion

With established liquidity and a functional governance apparatus, Q1 2027 expands CET market accessibility through the deployment of secondary liquidity pools on additional TON-native decentralized exchanges. Target platforms include **STON.fi** and any emerging high-volume TON DEX protocols that have achieved sufficient security track records. Secondary pools will be bootstrapped via governance-approved treasury allocation, ensuring that pool establishment is community-sanctioned and transparent. This expansion increases the surface area of CET price discovery, reduces single-DEX concentration risk, and enables arbitrage pathways that will tighten bid-ask spreads across all venues. Each secondary pool deployment will be preceded by a formal governance vote specifying the liquidity amount, initial price parameters, and targeted trading pair.

### Q2 2027 — Solaris Ecosystem Expansion

Q2 2027 marks the transition from infrastructure establishment to ecosystem activation. With governance tooling live and liquidity broadly distributed, the Solaris DAO will begin executing on the Community Incentives allocation through formal grant programs targeting: dApp developers building utilities atop the Solaris governance layer, researchers contributing to protocol security and tokenomic modeling, community educators expanding Solaris awareness across the global TON developer community, and potential cross-chain bridge implementations enabling CET to be represented on secondary networks while maintaining TON as the canonical chain of record. The Q2 2027 milestone also targets the public release of a formal **Solaris Developer SDK** — a TypeScript-native library abstracting TEP-74 Jetton interactions and governance proposal construction for third-party integrators.

---

## 7. Risk Factors & Legal Disclaimer

### 7.1 Regulatory Risk

The regulatory treatment of cryptographic tokens, decentralized finance protocols, and digital assets remains highly uncertain across virtually all global jurisdictions. Applicable laws and regulatory frameworks are evolving rapidly and may change significantly without advance notice. Depending on the jurisdiction, CET may be characterized as a security, commodity, utility token, or other financial instrument, each carrying different compliance obligations for issuers and holders. Participants should consult qualified legal counsel familiar with the applicable laws of their jurisdiction before acquiring, holding, trading, or otherwise interacting with CET tokens. The Solaris project makes no representation that CET is legally permissible for acquisition, holding, or trading in any particular jurisdiction.

### 7.2 Smart Contract Risk

Despite the inherent security advantages of TON's actor-model architecture and the implementation of multi-signature treasury controls, all smart contracts carry residual technical risk. Bugs, unexpected interactions, or edge-case vulnerabilities in the Jetton Master Contract, Jetton Wallet contracts, the V5 R1 multi-sig implementation, or the DeDust.io AMM contracts could potentially result in partial or total loss of funds. Users interact with all contracts entirely at their own risk. The Solaris project commits to ongoing security review and transparent public disclosure of any identified vulnerabilities, but cannot guarantee the complete absence of undiscovered flaws. No insurance or indemnification is provided for smart contract losses.

### 7.3 Market and Liquidity Risk

The market price of CET is determined by open market forces on DeDust.io and any secondary venues where liquidity may exist. CET, like all cryptographic assets, may experience extreme price volatility over short time periods. The value of CET may decline substantially or go to zero. Past price performance is not indicative of future results. Liquidity in the USDT/CET pool may be withdrawn by liquidity providers at any time, potentially reducing the ability of holders to exit positions at acceptable prices. Participants should only allocate capital they are prepared to lose in its entirety.

### 7.4 Technology Risk

The TON blockchain itself is a novel and rapidly evolving technology. Network disruptions, protocol-layer upgrades, validator consensus failures, or unforeseen interactions with TON's sharding architecture could affect the availability, finality, or correctness of CET-related transactions. The Solaris project has no control over TON's base-layer protocol and cannot guarantee uninterrupted service or transaction finality under all network conditions.

### 7.5 Not an Investment Offer

**This document does not constitute an offer to sell, a solicitation to buy, or a financial, investment, legal, or tax advisory communication of any kind with respect to CET tokens or any related instrument.** Nothing in this whitepaper should be interpreted as a promise, guarantee, or representation of future value, returns, or performance. The Solaris CET project is a community-governed decentralized protocol; it has no central corporate entity, no board of directors, and no fiduciary obligation to any token holder. All technical specifications, tokenomic parameters, and roadmap commitments described herein are subject to change through the governance process and are provided for informational purposes only. Prospective participants should conduct independent due diligence commensurate with their risk tolerance and applicable regulatory requirements.

---

## Appendix A: Key Contract Addresses

| Resource                     | Address / Identifier                                                               |
|------------------------------|------------------------------------------------------------------------------------|
| Jetton Master Contract       | `EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX`                                     |
| Treasury / Admin (V5 R1)     | `UQDUP2y5HBR1tRA3cZ6spDl2PV-KE2Wts_To5JTQQEf2favu`                               |
| DeDust USDT/CET Pool         | `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`                               |
| Whitepaper (IPFS)            | `bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a`                     |

---

## Appendix B: Glossary

| Term             | Definition                                                                                          |
|------------------|-----------------------------------------------------------------------------------------------------|
| **AMM**          | Automated Market Maker — a smart contract that prices assets algorithmically based on reserve ratios. |
| **Actor Model**  | TON's concurrency model where each contract is an isolated actor communicating via async messages.    |
| **CET**          | The ticker symbol for the Solaris governance and utility token.                                       |
| **DAO**          | Decentralized Autonomous Organization — governance by token-weighted on-chain voting.                |
| **Jetton**       | TON's standard for fungible tokens, defined in TEP-74.                                               |
| **Multi-Sig**    | A wallet requiring M-of-N cryptographic signatures before executing a transaction.                    |
| **TEP-74**       | TON Enhancement Proposal #74 — the canonical fungible token standard on TON.                         |
| **V5 R1**        | The latest TON wallet contract standard offering enhanced security and extended action support.       |

---

*Solaris CET Whitepaper v2.0 — Published March 2026. All rights reserved by the Solaris Community DAO.*

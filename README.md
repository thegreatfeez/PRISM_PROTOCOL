# 💎 Prism Protocol

> *Own. Stake. Borrow. Trade. All on-chain, forever.*

Prism Protocol is a fully on-chain gaming asset ecosystem where every item, character, and weapon is an NFT with a unique piece of art generated entirely on the blockchain. No external servers. No IPFS. No third-party dependencies. Just code and math — permanent and unstoppable.

The protocol is built for gamers and collectors who want real ownership and real yield from their digital assets.

---

## 📋 Table of Contents

- [💎 Prism Protocol](#-prism-protocol)
  - [📋 Table of Contents](#-table-of-contents)
  - [🌐 What is Prism Protocol?](#-what-is-prism-protocol)
  - [🔄 How It Works — The Big Picture](#-how-it-works--the-big-picture)
  - [💰 The Protocol Currency (ERC20)](#-the-protocol-currency-erc20)
  - [🎮 Gaming Assets — The NFTs](#-gaming-assets--the-nfts)
  - [🎨 On-Chain Art — Every NFT is Unique](#-on-chain-art--every-nft-is-unique)
  - [🛠 What You Can Do](#-what-you-can-do)
    - [Staking — Earn From Your Assets](#staking--earn-from-your-assets)
    - [Borrowing — Use Without Owning](#borrowing--use-without-owning)
    - [Marketplace — Buy and Sell](#marketplace--buy-and-sell)
    - [Token Faucet — Testnet PRM](#token-faucet--testnet-prm)
  - [💹 Revenue Flow — Where the Money Goes](#-revenue-flow--where-the-money-goes)
  - [🏛 Governance — Who Controls the Protocol](#-governance--who-controls-the-protocol)
  - [📖 User Guide](#-user-guide)
    - [Guide for Stakers](#guide-for-stakers)
    - [Guide for Borrowers](#guide-for-borrowers)
    - [Guide for Traders](#guide-for-traders)
    - [Guide: Testnet PRM (Faucet)](#guide-testnet-prm-faucet)
  - [🔧 Under The Hood — How Diamond Contracts Work](#-under-the-hood--how-diamond-contracts-work)
  - [🧩 The Facets — What Each Module Does](#-the-facets--what-each-module-does)
  - [📊 Protocol Economics](#-protocol-economics)
  - [🌐 Network Notes](#-network-notes)
  - [🔭 Future Plans](#-future-plans)
    - [Real Chainlink VRF](#real-chainlink-vrf)
    - [Governance Token](#governance-token)
    - [Multi-Collateral Borrowing](#multi-collateral-borrowing)
    - [Rental Guilds](#rental-guilds)
    - [Dynamic Borrow Pricing](#dynamic-borrow-pricing)
    - [Cross-Game Compatibility](#cross-game-compatibility)
    - [Reputation System](#reputation-system)
    - [Fractional Ownership](#fractional-ownership)
    - [DAO Treasury Management](#dao-treasury-management)
  - [🚀 Deployment](#-deployment)
    - [Prerequisites](#prerequisites)
    - [Run tests](#run-tests)
    - [Deploy](#deploy)
    - [Deployment order](#deployment-order)
    - [VRF Setup](#vrf-setup)
    - [Optional post-deployment](#optional-post-deployment)
    - [Adding FaucetFacet to an existing diamond](#adding-faucetfacet-to-an-existing-diamond)
    - [Upgrading any facet (Makefile)](#upgrading-any-facet-makefile)
    - [Frontend and contract addresses](#frontend-and-contract-addresses)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

---

## 🌐 What is Prism Protocol?

Prism Protocol is an on-chain ecosystem for gaming assets. Think of it as a marketplace, bank, and rental platform — all in one smart contract — specifically designed for NFTs that represent in-game items.

Here is what makes it different from other NFT projects:

**Everything is on-chain.** The artwork for every NFT is generated mathematically on the blockchain itself. There are no images stored on external servers. If the chain exists, your NFT exists — exactly as it was the day it was minted.

**Verifiable randomness.** Traits and visuals are seeded by a VRF coordinator so randomness is assigned at mint time and is fully on-chain. The architecture is built around the Chainlink VRF V2.5 interface. The current HashKey testnet deployment uses a mock VRF coordinator since Chainlink VRF does not yet support HashKey Chain — the integration is production-ready and will connect to real Chainlink VRF when support is added.

**Your assets work for you.** Instead of letting your gaming items sit idle in your wallet, you can stake them and earn income every time someone borrows them to play.

**Borrowing instead of buying.** Not everyone can afford to buy a rare gaming asset outright. Prism Protocol lets players borrow assets for a fixed period, use them in-game, and return them — paying only a small fee instead of the full price.

**Governed by its owners.** The protocol is not controlled by a single person. Decisions are made by a group of trusted addresses who must reach agreement before anything changes.

---

## 🔄 How It Works — The Big Picture

```
Protocol mints gaming assets in batches (multisig governance)
                        ↓
         Assets distributed to community and treasury
                        ↓
         ┌──────────────────────────────────┐
         │                                  │
    Holders stake                      Holders sell
    assets to earn                     on marketplace
    borrow fees                             │
         │                            Buyers purchase
         ↓                            with ERC20 tokens
    Assets enter                            │
    borrow market                           ↓
         │                          New owners can
    Borrowers pay                   stake or list
    fee + collateral                for borrowing
         │
         ↓
    Fee split:
    80% → Staker
    20% → Treasury
         │
         ↓
    Borrower uses
    asset in-game
         │
         ↓
    Returns before           Misses deadline
    deadline → gets     →    NFT burned, collateral
    collateral back          forfeited
```

Every action in the protocol uses the ERC20 token as currency. Every fee that flows through the system either rewards asset owners or gets burned — making existing tokens slightly more valuable over time.

---

## 💰 The Protocol Currency (ERC20)

The protocol has its own ERC20 token that powers everything inside it.

**You use it to:**
- Buy NFTs on the marketplace
- Pay borrow fees when renting an asset

**On testnet, you can get PRM from:**
- The in-app **Faucet** page (once `FaucetFacet` is on the diamond and signers have minted PRM into the diamond’s balance — see [Token Faucet](#token-faucet--testnet-prm))
- Governance mints to your wallet, marketplace sales, or borrow/stake flows as usual on mainnet-style deployments

**You earn it by:**
- Staking your NFTs and earning from borrow fees
- Selling your NFTs on the marketplace

The token is deflationary — a portion of every marketplace sale is permanently burned, reducing total supply over time. Borrow fees are split between stakers and the protocol treasury. No inflation. No artificial rewards. Only real yield from real activity.

---

## 🎮 Gaming Assets — The NFTs

Gaming assets are minted by the protocol team through a multisig governance process. There is no fixed supply cap — as the game expands with new seasons, characters, and item types, new assets are minted in batches.

Each batch mint goes through the full governance process — the team proposes it, enough approvers sign off, and only then does the batch execute. No single person can mint assets unilaterally.

After minting, assets are distributed through a combination of:

- **Community airdrops** — rewarding early players and supporters
- **Marketplace listings** — treasury sells at a launch price
- **Partnership allocations** — distributed to game partners and guilds

---

## 🎨 On-Chain Art — Every NFT is Unique

Every gaming asset has a unique piece of visual art that lives entirely on the blockchain. No external links. No IPFS. The image is generated mathematically from a seed number that is assigned to your token at the moment it is minted.

This seed drives five visual properties:

| Property | What changes |
|---|---|
| Color | The entire color palette — from deep crimson to ocean blue |
| Background | Dark, mid, or light tone with a complementary hue |
| Weapon type | Sword, Gun, Bow & Arrow, Axe, Spear, or Arrow |
| Shape size | Small and delicate to large and bold |
| Rotation | The angle the weapon sits at |

The seed is provided by a VRF coordinator — no two tokens will ever share the same seed, and therefore no two tokens will ever look exactly alike. On the current HashKey testnet deployment, a mock coordinator fulfills this role and generates the seed synchronously at mint time. The architecture is built around the Chainlink VRF V2.5 interface and will connect to real Chainlink VRF when HashKey Chain support is added.

Each SVG also prints the token's trait label (Attack, Defense, or Mage) directly on the image so it is visible in wallets and marketplaces without any off-chain lookups.

You can verify the art yourself. The image is stored as a base64-encoded SVG directly inside the token metadata. Any wallet or explorer that supports the ERC721 metadata standard will render it correctly — no server required.

---

## 🛠 What You Can Do

### Staking — Earn From Your Assets

Staking turns your idle gaming assets into income-generating instruments. When you stake an NFT, it enters the borrow marketplace and earns a share of every borrow fee paid by players who rent it.

**How staking works:**

1. Choose a staking duration — 30, 60, or 90 days
2. Set your NFT's borrow price in ERC20 tokens
3. Your NFT is held securely in the protocol contract and appears in the borrow marketplace
4. Every time someone borrows your NFT, you receive 80% of the borrow fee instantly
5. When the staking period ends and no active borrow exists, you get your NFT back

Stake duration only affects availability. Your reward share stays at 80% of borrow fees regardless of how long you stake.

**Your NFT is safe.** The protocol cannot move or sell it — only return it to you when staking ends, or send it temporarily to a borrower who has posted sufficient HSK collateral.

---

### Borrowing — Use Without Owning

Not every player needs to own a rare asset permanently. Prism Protocol lets you borrow any staked NFT for a period of your choosing, use it in-game, and return it to claim your collateral back.

**How borrowing works:**

1. Browse the borrow marketplace and find an asset you need
2. Check the available duration — you can only borrow for the time remaining in the staker's lock period
3. Post HSK collateral and pay a small ERC20 borrow fee
4. The NFT transfers to your wallet — you have full ERC721 ownership for the duration
5. Return the NFT before the deadline to receive your full collateral back

**What happens if you miss the deadline:**
- The NFT is burned permanently
- You lose your collateral permanently
- The staker receives 80% of the collateral
- The protocol receives 20% of the collateral

This mechanism protects stakers and ensures borrowers have a real incentive to return on time.

---

### Marketplace — Buy and Sell

The marketplace is where permanent ownership changes hands. Any NFT holder can list their asset at a fixed ERC20 price.

**As a seller:**
1. Your NFT must be in your wallet and free of any staking or borrow commitments
2. List it at your chosen ERC20 price
3. Update or cancel the listing at any time before a sale
4. On sale, receive the price minus the platform fee

**As a buyer:**
1. Browse active listings
2. Purchase with ERC20 tokens — the NFT arrives in your wallet instantly

A small platform fee is charged on every sale and permanently burned, removing that ERC20 from circulation forever.

---

### Token Faucet — Testnet PRM

The **Faucet** lets each wallet claim a fixed amount of PRM from the **diamond’s PRM balance** on a cooldown (defaults: **100 PRM** per claim, **12 hours** between claims; governance can change these).

**How it works on-chain:**

1. Signers pass a **Fund Faucet** proposal (or any `mintERC20` that mints to the **diamond proxy** address). That balance is what users drain when they claim.
2. Users call `claimFaucet` on the **diamond** (via `FaucetFacet` logic). Tokens transfer from the diamond’s internal ERC20 balance to the user.

**Before users can claim:**

- **`FaucetFacet` must be registered** on the diamond (`diamondCut` Add). Fresh deploys from `DeployDiamond.s.sol` include it; older diamonds need a one-off upgrade (see [Adding FaucetFacet](#adding-faucetfacet-to-an-existing-diamond)).
- **Gas** on HashKey testnet is paid in **HSK**. Use the official HSK faucet when you need gas: [https://faucet.hsk.xyz/faucet](https://faucet.hsk.xyz/faucet).

**App route:** `/faucet` in `prism-frontend`.

---

## 💹 Revenue Flow — Where the Money Goes

Prism Protocol is designed around real revenue — not inflation. Here is exactly where every token flows:

**Borrow fees:**
```
Borrower pays fee in ERC20
            ↓
80% → Staker (the NFT owner who locked it in)
20% → Protocol treasury
```

**Marketplace sales:**
```
Buyer pays full listing price in ERC20
            ↓
Platform fee (e.g. 2.5%) → Burned permanently
Remainder → Seller
```

**Liquidation collateral:**
```
Borrower misses deadline → position liquidated
            ↓
80% of HSK collateral → Staker / Lender
20% of HSK collateral → Protocol treasury
NFT → Burned permanently
```

**Treasury revenue is used for:**
- Funding future protocol development
- Seeding liquidity for new asset releases
- Community grants and incentive programs
- Additional token burns for deflationary pressure

Stakers earn only from real borrow activity. If nobody borrows, stakers earn nothing. This keeps the protocol economically honest — rewards reflect actual demand, not artificial inflation.

---

## 🏛 Governance — Who Controls the Protocol

Prism Protocol is governed by a multisig — a group of trusted addresses that must reach a set approval threshold before any privileged action can execute.

**What governance controls:**
- Minting new asset batches
- Initializing and updating the ERC20 token
- Minting PRM to arbitrary addresses, **including the diamond** to fund the on-chain faucet (**Fund Faucet** in the app)
- Faucet parameters: per-claim amount and cooldown (`setFaucetAmount`, `setFaucetCooldown`) once `FaucetFacet` is installed
- Setting the ERC20/HSK collateral exchange rate
- Setting marketplace platform fees
- Configuring staking duration tiers and reward splits
- Upgrading the protocol (adding or replacing facets via `diamondCut`)
- Treasury withdrawals

Proposal forms in the frontend use **human-readable amounts** for PRM and ETH (for example `1` for one token); **wei / 18 decimals** are applied automatically where relevant. Raw integers still apply to token IDs, basis points, and time in seconds.

**How a governance action works:**
1. Any signer proposes an action by submitting ABI-encoded calldata
2. Other signers review and approve on-chain
3. Once the approval threshold is reached, any signer can execute
4. The action runs — and only then

The **Recent Proposals** list decodes calldata into **readable titles and parameters** (mint, faucet, marketplace, `diamondCut`, etc.) so you are not staring at raw hex alone.

No single person can act alone. Every privileged change requires consensus. If a signer changes their mind before execution, they can revoke their approval — giving the group time to reconsider any proposal before it takes effect.

---

## 📖 User Guide

### Guide for Stakers

**Before you start:**
- You must own at least one gaming asset NFT
- The NFT must not be currently staked, listed, or borrowed

**Step 1 — Go to My NFTs**

Find the NFT you want to stake. Click "Stake".

**Step 2 — Choose your staking duration**

Select 30, 60, or 90 days. You cannot unstake early — choose a duration you are comfortable with.

**Step 3 — Set your borrow price**

This is the ERC20 price used to calculate the borrow fee and HSK collateral. Collateral is set at 200% of this price. Think about what rent is fair for the value of your asset.

**Step 4 — Stake**

Confirm the transaction. Your NFT moves to the protocol contract and your listing becomes visible in the borrow marketplace immediately.

**Step 5 — Earn**

Every time your NFT is borrowed, 80% of the borrow fee arrives in your wallet automatically. No further action needed.

**Step 6 — Unstake**

After the staking period ends and no active borrow exists, go to Staking and click "Unstake". Your NFT returns to your wallet.

**If a borrower misses their deadline:**

You can liquidate the position. You receive 80% of the borrower's HSK collateral and the NFT is burned. The protocol receives 20%.

---

### Guide for Borrowers

**Before you start:**
- You need HSK for collateral and ERC20 tokens for the borrow fee
- Check the deadline carefully — missing it costs you your full collateral

**Step 1 — Browse the Borrow page**

Each listing shows the required HSK collateral, borrow fee in ERC20, and the maximum duration available.

**Step 2 — Approve ERC20 spending**

Before borrowing, approve the protocol to spend your ERC20 tokens for the borrow fee.

**Step 3 — Borrow**

Click "Borrow" and confirm the transaction with the required HSK attached as collateral. The NFT arrives in your wallet.

**Step 4 — Use the asset in-game**

You have full ERC721 ownership for the duration. Use it however the game allows.

**Step 5 — Return before the deadline**

Click "Return" on the Borrow page before your deadline. The NFT goes back and your collateral is refunded in full.

**If you miss the deadline:**

Your position can be liquidated by anyone. The NFT is burned and your collateral is permanently forfeited.

---

### Guide for Traders

**Listing your NFT:**

1. Make sure your NFT is in your wallet and not staked or borrowed
2. Go to My NFTs and click "List"
3. Set your price in ERC20 tokens
4. Update the price or cancel the listing at any time

**Buying an NFT:**

1. Browse the Marketplace
2. Approve ERC20 spending if you haven't already
3. Click "Buy" — the NFT arrives in your wallet and the ERC20 is deducted instantly

**Platform fee:**

A small percentage of every sale is burned. This comes out of the buyer's payment before the seller receives proceeds. The fee is visible on every listing.

---

### Guide: Testnet PRM (Faucet)

1. Add **HSK** for gas using the official faucet: [https://faucet.hsk.xyz/faucet](https://faucet.hsk.xyz/faucet).
2. In the app, open **Faucet** in the sidebar (`/faucet`).
3. Connect the wallet you want to receive PRM.
4. If the pool shows a balance and you are off cooldown, click **Claim**. PRM is sent from the **diamond** balance to your wallet.
5. If the UI says the **faucet facet is missing**, run a `diamondCut` that adds `FaucetFacet` (see deployment section). If the pool is empty, ask signers to pass **Fund Faucet** (or mint PRM to the diamond) via governance.

Listing and updating marketplace prices in the app use **decimal PRM** (for example `1` for one token), not raw wei.

---

## 🔧 Under The Hood — How Diamond Contracts Work

*You do not need to understand this to use the protocol. This section is for the curious.*

Most smart contracts are a single file deployed to a single address. This works fine for simple projects but becomes a problem when:
- The contract grows too large (Ethereum has a 24KB bytecode limit per contract)
- You need to fix a bug or add a feature after deployment
- Different parts of the contract need to evolve at different speeds

**The Diamond Standard (EIP-2535)** solves this by splitting a contract into a central proxy and multiple logic modules called **facets**.

```
User calls Diamond address
          ↓
Diamond looks up which facet handles this function selector
          ↓
Diamond forwards the call to that facet using delegatecall
          ↓
Facet logic runs, but reads and writes Diamond's storage
          ↓
Result returns to user
```

From the outside, everything looks like one contract at one address. Inside, the logic is split across many modular facets that can be added, replaced, or removed independently — without touching any existing state.

**AppStorage — one place for all data:**

Every facet in Prism Protocol reads and writes from a single `AppStorage` struct. This is a deliberate design choice to prevent storage collisions — the most dangerous bug in upgradeable contracts. Every piece of state the protocol needs is defined upfront in one place and every facet accesses it the same way.

**Why this matters for users:**

Your NFTs, balances, staking records, and borrow positions all live at the Diamond's address permanently. If a facet is upgraded, your data is untouched — only the logic changes. This is what makes the protocol both upgradeable and trustworthy.

---

## 🧩 The Facets — What Each Module Does

| Facet | What it does |
|---|---|
| **DiamondCutFacet** | Handles protocol upgrades — adding, replacing, or removing logic modules. Only executable through multisig after initialization. |
| **DiamondLoupeFacet** | Lets anyone inspect the protocol — see which facets exist and which functions each one handles. Full transparency. |
| **OwnershipFacet** | Manages the bootstrap owner used only during initial deployment. After multisig is initialized, this becomes dormant. |
| **MultisigFacet** | The governance engine. Handles proposals, approvals, revocations, and execution of all privileged protocol actions. |
| **ERC721Facet** | The gaming asset NFTs. Handles ownership, transfers, approvals, and batch minting. Minting is multisig-gated. |
| **ERC20Facet** | The protocol currency. Standard ERC20 token with mint and burn capabilities controlled by governance. |
| **SVGFacet** | Generates fully on-chain artwork for every NFT. Reads the token's unique VRF seed and builds an SVG image with no external dependencies. |
| **StakingFacet** | Lets NFT holders lock assets for fixed periods to earn income from borrow fees. Manages stake records and reward distribution. |
| **BorrowFacet** | Lets players rent NFTs for a fixed time by posting HSK collateral. Handles borrow listings, active borrows, returns, and liquidations. |
| **MarketplaceFacet** | Peer-to-peer NFT trading in ERC20 tokens. Handles listings, purchases, price updates, and cancellations. |
| **TreasuryFacet** | Secure withdrawals of protocol-held ERC20 and HSK funds, gated by multisig. |
| **VRFFacet** | VRF coordinator integration for on-chain randomness used in trait assignment and SVG generation. Chainlink VRF V2.5 on supported networks, mock coordinator on HashKey testnet. |
| **FaucetFacet** | Testnet-oriented PRM drip: users `claimFaucet` from the diamond’s PRM balance on a per-wallet cooldown; signers set amount/cooldown and fund the pool by minting PRM to the **diamond** address. |

---

## 📊 Protocol Economics

| Action | Cost to user | Where it goes |
|---|---|---|
| Batch mint | Gas only (governance) | New assets to Diamond / treasury |
| Buy NFT | Full listing price in ERC20 | Seller gets proceeds minus platform fee |
| Platform fee on sale | % of sale price in ERC20 | Burned permanently |
| Stake NFT | Lock NFT for X days | Earns 80% of all borrow fees on that NFT |
| Borrow NFT | HSK collateral + ERC20 borrow fee | Collateral returned on time, fee split 80/20 |
| Return NFT on time | Nothing extra | Full HSK collateral refunded |
| Miss borrow deadline | Collateral forfeited | NFT burned, 80% to staker, 20% to protocol |
| Liquidate overdue position | Gas only | NFT burned, 80% to staker, 20% to protocol |
| Claim faucet (testnet) | Gas (HSK) | PRM from diamond balance to claimer; pool funded by governance |

---

## 🌐 Network Notes

The current deployment is live on **HashKey Chain testnet** (Chain ID 133).

| Feature | Status |
|---|---|
| Diamond contracts | ✅ Deployed |
| On-chain SVG art | ✅ Working |
| Multisig governance | ✅ Working |
| Staking & borrowing | ✅ Working |
| Marketplace | ✅ Working |
| Token faucet (`FaucetFacet`) | ✅ After `diamondCut` add + funded pool (see deployment) |
| VRF randomness | ⚠️ Mock coordinator (Chainlink VRF not yet on HashKey) |

**Why a mock VRF?**

Chainlink VRF V2.5 does not currently support HashKey Chain. The mock coordinator (`MockVRFCoordinator.sol`) implements the exact same interface as the real Chainlink coordinator and fulfills randomness synchronously at mint time — meaning traits and SVG art resolve immediately without waiting for an oracle callback.

The VRF architecture in the codebase is production-ready. Swapping from the mock to real Chainlink VRF requires only one operation — calling `setReqData` with the real coordinator address, subscription ID, and key hash. No contract changes. No redeployment. When Chainlink adds HashKey support or the protocol moves to a supported network, the switch is a single transaction.

**Deployed contract addresses (HashKey testnet):**

| Contract | Address |
|---|---|
| Diamond | `0x5A9E09a12f3513F72161976818e87574bf9aD1E1` |
| DiamondCutFacet | `0x70D428e9a61F4Ee4aC0Db823413f9248f618A480` |
| DiamondLoupeFacet | `0x1D1F2A70C15634c484Ef13d060e7809538AC8878` |
| OwnershipFacet | `0x20B07c3d614482d561076884482be5B431e6862f` |
| ERC721Facet | `0x9db71D29D55Ff2aFd1803b4E61a5b470eb807881` |
| ERC20Facet | `0x04323E8EB6655654021D169B4389Db7e33Aacd28` |
| BorrowFacet | `0xFC7e730b46ea01601ea2a9F43053E4004348F8B4` |
| MarketplaceFacet | `0xe593704a5Aa233641C5a43Ca198f8d1D1fcd3E8C` |
| StakingFacet | `0xf173271fbfc1d30FC25b6eE33Aa04B76033295dE` |
| MultisigFacet | `0xc021cEdc29Abc538C281541258D896DF3dec94D4` |
| TreasuryFacet | `0x4F3F1cB798eB36082b9Fecf84fC9b597B3d02d3A` |
| VRFFacet | `0x39FD1c27337FB54dC961aAcc6704116f8EA056Eb` |
| SVGFacet | `0x4eD44326AAe00ECD10a97f30C891847d2c7c5D1f` |
| FaucetFacet (implementation) | `0xF8d827ab460371E1161AAed013f4519a11986219` |
| MockVRFCoordinator | `0x0c55C73B0ff33B973886989732E3f8B7A73992D0` |

---

## 🔭 Future Plans

Prism Protocol is designed to grow. The Diamond architecture makes adding new features straightforward — each new feature is a new facet, not a redeployment.

### Real Chainlink VRF

When Chainlink VRF adds HashKey Chain support, migration is a single `setReqData` call pointing to the real coordinator address, subscription ID, and key hash. The entire VRF architecture is already in place — no contract changes, no redeployment.

### Governance Token

The current multisig model is effective for a small founding team but does not scale to a decentralized community. The next major milestone is a governance token that gives the broader community real voting power.

A two-layer system will be introduced:

```
Community votes on proposal (governance token holders)
                ↓
Vote passes community threshold
                ↓
Proposal moves to multisig queue
                ↓
Multisig signers approve
                ↓
Action executes
```

No new asset supply can be minted without both the community and the multisig agreeing. Token holders get real power — not just advisory input.

### Multi-Collateral Borrowing

Support for additional collateral assets beyond HSK — including stablecoins and other accepted tokens. Governance controls which assets are accepted and at what collateral ratios.

### Rental Guilds

Groups of asset holders pooling their NFTs into a shared staking vault. Borrow fees distributed proportionally to guild members. Ideal for gaming guilds managing large collections of assets.

### Dynamic Borrow Pricing

Borrow fee rates that adjust automatically based on utilization. High-demand assets cost more to borrow. Low-demand assets become cheaper to attract borrowers. All driven on-chain by a utilization rate curve — no manual intervention required.

### Cross-Game Compatibility

Assets usable across multiple games that integrate the protocol. A weapon minted for one game could be borrowed for use in another. The ERC721 standard makes this composable by default.

### Reputation System

On-chain borrower reputation scores. Borrowers who consistently return on time build a verifiable track record that unlocks lower collateral requirements. Defaulters face higher requirements. Fully transparent and stored on-chain.

### Fractional Ownership

Split ownership of high-value assets across multiple holders. Each fractional holder earns a proportional share of staking rewards. Makes expensive rare assets accessible to more players without requiring full purchase.

### DAO Treasury Management

As the protocol treasury accumulates revenue, governance token holders vote on deployment — liquidity provision, token buybacks, grants, and new asset development.

---

## 🚀 Deployment

### Prerequisites

```bash
forge install
```

### Run tests

```bash
forge test
```

### Deploy

```bash
make deploy-hashkey
```

Or directly:

```bash
forge script script/DeployDiamond.s.sol:DeployDiamond \
  --rpc-url https://testnet.hsk.xyz \
  --account yourKeystore \
  --sender YOUR_ADDRESS \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url https://hashkey.blockscout.com/api/ \
  -vvvv
```

### Deployment order

1. Deploy `DiamondCutFacet`
2. Deploy `Diamond` with deployer address and cut facet address
3. Deploy all remaining facets
4. Add all facets via `diamondCut`
5. Ensure `tokenURI` selector points to `SVGFacet`
6. Call `initMultisig(owners, threshold)` directly as deployer — this is the only action available without multisig
7. All further actions go through multisig proposals: `initERC20`, `initialize` (ERC721 name/symbol), `batchMint`, `mintERC20`, `setStakeDurations`, `setERC20PerEth`, `setPlatformFee`. **`DeployDiamond.s.sol`** registers **FaucetFacet** together with borrow, marketplace, staking, and treasury (VRF/SVG follow as in the script). To turn on claims, mint PRM to the **diamond** via governance (**Fund Faucet** in the app).

### Adding FaucetFacet to an existing diamond

If the diamond was deployed before Faucet existed, add the facet once (no full redeploy):

1. In the repo root **`.env`**, set **`DIAMOND=`** to your **diamond proxy** (same address as the app). **Do not** put a trailing `;` on the line.
2. Run:

```bash
make upgrade-faucet
```

That runs `script/UpgradeFacet.s.sol`: deploys a new `FaucetFacet` implementation, builds the `diamondCut` **Add** (or **Replace** when updating), and — if your multisig threshold allows it from one wallet — **propose → approve → execute** in one broadcast.

If your multisig is **N-of-M** and one key cannot execute alone, deploy the facet and print proposal calldata instead:

```bash
forge script script/PrepareFaucetDiamondCut.s.sol:PrepareFaucetDiamondCut --rpc-url https://testnet.hsk.xyz --broadcast -vv
```

Copy the logged **hex** and submit it as a normal multisig proposal targeting the diamond.

**Verify the implementation (optional):**

```bash
forge verify-contract \
  --rpc-url https://testnet.hsk.xyz \
  --verifier blockscout \
  --verifier-url 'https://testnet-explorer.hsk.xyz/api/' \
  YOUR_FACET_IMPLEMENTATION_ADDRESS \
  contracts/facets/FaucetFacet.sol:FaucetFacet
```

### Upgrading any facet (Makefile)

From the repo root, with **`DIAMOND`** and Foundry keystore variables set as for deploy:

| Command | Facet |
|--------|--------|
| `make upgrade-faucet` | FaucetFacet |
| `make upgrade-marketplace` | MarketplaceFacet |
| `make upgrade-erc20` | ERC20Facet |
| … | *(see `Makefile` for the full list)* |

Generic:

```bash
make upgrade-hashkey FACET=ExactFacetName
```

`UpgradeFacet` supports: `ERC721Facet`, `ERC20Facet`, `BorrowFacet`, `MarketplaceFacet`, `StakingFacet`, `TreasuryFacet`, `SVGFacet`, `VRFFacet`, `MultisigFacet`, `OwnershipFacet`, `DiamondLoupeFacet`, `DiamondCutFacet` (risky), `FaucetFacet`.

### Frontend and contract addresses

The **frontend only needs the diamond proxy** (`DIAMOND_ADDRESS` in `prism-frontend/src/config/contracts.ts`). All faucet calls use that address plus the small **`FAUCET_ABI`** fragment already in the repo. You do **not** point the UI at the `FaucetFacet` implementation address for reads or writes.

### VRF Setup

**HashKey testnet (mock VRF):**

```bash
# Deploy mock coordinator
make deploy-mock-vrf

# Point Diamond to mock
cast send $DIAMOND "setReqData((uint256,bytes32,uint32,uint16,uint32,address))" \
  "(1, 0x0000000000000000000000000000000000000000000000000000000000000000, 100000, 3, 2, MOCK_VRF_ADDRESS)" \
  --account yourKeystore \
  --rpc-url https://testnet.hsk.xyz
```

The mock fulfills randomness synchronously — no subscription or LINK tokens needed. When Chainlink adds HashKey support, migration is a single `setReqData` call pointing to the real coordinator. No contract changes required.

### Optional post-deployment

```bash
# Permanently burn bootstrap ownership after multisig is confirmed working
cast send $DIAMOND "transferOwnership(address)" \
  "0x0000000000000000000000000000000000000000" \
  --account yourKeystore
```

---

## 🤝 Contributing

Prism Protocol is open source. Contributions are welcome — new facets, gas optimisations, test coverage, documentation improvements.

Please open an issue before submitting a pull request so the change can be discussed first.

---

## 📄 License

MIT License. See `LICENSE` for details.

---

*Built with [Foundry](https://book.getfoundry.sh/) · [EIP-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535) · Deployed on [HashKey Chain](https://www.hashkey.com/) · Solidity ^0.8.0*
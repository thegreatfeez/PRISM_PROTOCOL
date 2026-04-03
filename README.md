# 💎 Prism Protocol

> *Own. Stake. Borrow. Trade. All on-chain, forever.*

Prism Protocol is a fully on-chain gaming asset ecosystem where every item, character, and weapon is an NFT with a unique piece of art generated entirely on the blockchain. No external servers. No IPFS. No third-party dependencies. Just code and math — permanent and unstoppable.

The protocol is built for gamers and collectors who want real ownership and real yield from their digital assets.

---

## 📋 Table of Contents

- [💎 Prism Protocol](#prism-protocol)
  - [📋 Table of Contents](#-table-of-contents)
  - [🌐 What is Prism Protocol?](#what-is-prism-protocol)
  - [🔄 How It Works — The Big Picture](#-how-it-works--the-big-picture)
  - [💰 The Protocol Currency (ERC20)](#-the-protocol-currency-erc20)
  - [🎮 Gaming Assets — The NFTs](#-gaming-assets--the-nfts)
  - [🎨 On-Chain Art — Every NFT is Unique](#-on-chain-art--every-nft-is-unique)
  - [🛠 What You Can Do](#-what-you-can-do)
    - [Staking — Earn From Your Assets](#staking--earn-from-your-assets)
    - [Borrowing — Use Without Owning](#borrowing--use-without-owning)
    - [Marketplace — Buy and Sell](#marketplace--buy-and-sell)
  - [💹 Revenue Flow — Where the Money Goes](#-revenue-flow--where-the-money-goes)
  - [🏛 Governance — Who Controls the Protocol](#-governance--who-controls-the-protocol)
  - [📖 User Guide](#-user-guide)
    - [Guide for Stakers](#guide-for-stakers)
    - [Guide for Borrowers](#guide-for-borrowers)
    - [Guide for Traders](#guide-for-traders)
  - [🔧 Under The Hood — How Diamond Contracts Work](#-under-the-hood--how-diamond-contracts-work)
  - [🧩 The Facets — What Each Module Does](#-the-facets--what-each-module-does)
  - [📊 Protocol Economics](#-protocol-economics)
  - [🔭 Future Plans](#-future-plans)
    - [Governance Token](#governance-token)
    - [Rental Guilds](#rental-guilds)
    - [Dynamic Borrow Pricing](#dynamic-borrow-pricing)
    - [Cross-Game Compatibility](#cross-game-compatibility)
    - [Reputation System](#reputation-system)
    - [Fractional Ownership](#fractional-ownership)
    - [On-Chain Trait Upgrades](#on-chain-trait-upgrades)
    - [DAO Treasury Management](#dao-treasury-management)
  - [🚀 Deployment](#-deployment)
    - [Prerequisites](#prerequisites)
    - [Run tests](#run-tests)
    - [Deploy](#deploy)
    - [Deployment order](#deployment-order)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

---

## 🌐 What is Prism Protocol?

Prism Protocol is an on-chain ecosystem for gaming assets. Think of it as a marketplace, bank, and rental platform — all in one smart contract — specifically designed for NFTs that represent in-game items.

Here is what makes it different from other NFT projects:

**Everything is on-chain.** The artwork for every NFT is generated mathematically on the blockchain itself. There are no images stored on external servers. If Ethereum exists, your NFT exists — exactly as it was the day it was minted.

**Your assets work for you.** Instead of letting your gaming items sit idle in your wallet, you can stake them and earn income every time someone borrows them to play.

**Borrowing instead of buying.** Not everyone can afford to buy a rare gaming asset outright. Prism Protocol lets players borrow assets for a fixed period, use them in-game, and return them — paying only a small fee instead of the full price.

**Governed by its owners.** The protocol is not controlled by a single person. Decisions are made by a group of trusted addresses who must reach agreement before anything changes.

---

## 🔄 How It Works — The Big Picture

```
Protocol mints gaming assets in batches
             ↓
Assets distributed to community and treasury
             ↓
        ┌────────────────────────────────┐
        │                                │
   Holders stake                    Holders sell
   assets to earn                   on marketplace
   borrow fees                           │
        │                           Buyers purchase
        ↓                           with ERC20 tokens
   Assets enter                          │
   borrow market                         ↓
        │                         New owners can
   Borrowers pay                  stake or list
   fee + collateral               for borrowing
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
   Returns before
   deadline → gets
   collateral back
```

Every action in the protocol uses the ERC20 token as currency. Every fee that flows through the system either rewards asset owners or gets burned — making existing tokens slightly more valuable over time.

---

## 💰 The Protocol Currency (ERC20)

The protocol has its own ERC20 token that powers everything inside it.

You use it to:
- Buy NFTs on the marketplace
- Pay borrow fees when renting an asset
- Post collateral when borrowing
- Receive staking rewards

You earn it by:
- Staking your NFTs and earning from borrow fees
- Selling your NFTs on the marketplace

The token is deflationary — a portion of every marketplace sale and borrow fee is permanently burned, reducing total supply over time. As the protocol grows and more assets are borrowed and traded, the burn rate increases.

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
| Shape type | Circle, square, triangle, ellipse, or star |
| Shape size | Small and delicate to large and bold |
| Rotation | The angle the shape sits at |

Because the seed is derived from the token ID, the timestamp, and the recipient address, no two tokens will ever share the same seed — and therefore no two tokens will ever look exactly alike.

You can verify this yourself. The image is stored as a base64-encoded SVG directly inside the token metadata. No server required to display it — any wallet or explorer that supports the ERC721 metadata standard will render it correctly.

---

## 🛠 What You Can Do

### Staking — Earn From Your Assets

Staking turns your idle gaming assets into income-generating instruments. When you stake an NFT, it enters the borrow marketplace and earns a share of every borrow fee paid by players who rent it.

**How staking works:**

1. You choose a staking duration — 30, 60, or 90 days
2. Your NFT is held securely in the protocol contract
3. Your NFT appears in the borrow marketplace with your chosen collateral requirement
4. Every time someone borrows your NFT, you receive 80% of the borrow fee instantly
5. When the staking period ends and no active borrow exists, you get your NFT back

**Longer commitments earn more.** A 90-day stake earns a higher share of borrow fees than a 30-day stake, rewarding long-term participants.

**Important:** Your NFT is safe in the contract. The protocol cannot move or sell it — only return it to you when the staking period ends, or send it temporarily to a borrower who has posted sufficient collateral.

---

### Borrowing — Use Without Owning

Not every player needs to own a rare asset permanently. Prism Protocol lets you borrow any staked NFT for a period of your choosing, use it in-game, and return it to claim your collateral back.

**How borrowing works:**

1. Browse the borrow marketplace and find an asset you need
2. Check the available duration — you can only borrow for the time remaining in the staker's lock period
3. Post the required collateral plus a small borrow fee
4. The NFT transfers to your wallet — you have full ownership for the duration
5. Return the NFT before the deadline to receive your collateral back

**What happens if you miss the deadline:**
- The NFT is burned permanently
- You lose your collateral permanently
- The staker receives your collateral as compensation

This means collateral should be set close to the actual value of the asset. It protects stakers and ensures borrowers have a real incentive to return on time.

---

### Marketplace — Buy and Sell

The marketplace is where permanent ownership changes hands. Any NFT holder can list their asset at a fixed ERC20 price.

**As a seller:**
1. List your NFT at your chosen price
2. Update the price any time before a sale
3. Cancel the listing whenever you want
4. When sold, receive the price minus the platform fee

**As a buyer:**
1. Browse active listings
2. Purchase with ERC20 tokens
3. NFT transfers to your wallet instantly

A small platform fee is charged on every sale and permanently burned — removing that ERC20 from circulation forever.

**Note:** You cannot list an NFT that is currently staked or being borrowed. The asset must be in your wallet and free of commitments.

---

## 💹 Revenue Flow — Where the Money Goes

Prism Protocol is designed around real revenue — not inflation. Here is exactly where every ERC20 token flows:

**Borrow fees:**
```
Borrower pays fee
        ↓
80% → Staker (the NFT owner who staked it)
20% → Protocol treasury
```

**Marketplace sales:**
```
Buyer pays price
        ↓
Platform fee (e.g. 2.5%) → Burned permanently
Remainder → Seller
```

**Treasury revenue is used for:**
- Funding future protocol development
- Seeding liquidity for new asset releases
- Community grants and incentive programs
- Burning for additional deflationary pressure

Stakers earn only from real borrow activity. If nobody borrows, stakers earn nothing. This keeps the protocol economically honest — rewards reflect actual demand for assets, not artificial inflation.

---

## 🏛 Governance — Who Controls the Protocol

Prism Protocol is governed by a multisig — a group of trusted addresses that must reach a set approval threshold before any privileged action executes.

**What governance controls:**
- Minting new asset batches
- Setting borrow fee rates
- Setting marketplace platform fees
- Configuring staking duration tiers and reward splits
- Upgrading the protocol (adding or replacing logic)

**How a governance action works:**
1. Any owner proposes an action with the relevant parameters
2. Other owners review and approve
3. Once the threshold is reached, any owner can execute
4. The action runs — and only then

No single person can act alone. Every change requires consensus.

**Revoking approval:** If an owner changes their mind before execution, they can revoke their approval. This gives the group time to reconsider any proposal before it takes effect.

---

## 📖 User Guide

### Guide for Stakers

**Before you start:**
- You must own at least one gaming asset NFT
- You must have enough ERC20 to cover gas

**Step 1 — Choose your staking duration**

Decide how long you want to stake. Options are 30, 60, or 90 days. Longer periods earn a higher share of borrow fees. You cannot unstake early.

**Step 2 — Set your collateral requirement**

This is the amount a borrower must post to rent your NFT. Set it close to the market value of your asset — this is your protection if a borrower misses their deadline and the NFT is burned.

**Step 3 — Stake**

Call `stake(tokenId, duration, requiredCollateral)`. Your NFT moves to the protocol contract and your listing becomes visible in the borrow marketplace.

**Step 4 — Earn**

Every time your NFT is borrowed, 80% of the borrow fee is sent to your wallet immediately. You do not need to do anything — rewards arrive automatically.

**Step 5 — Unstake**

When your staking period ends and no active borrow exists, call `unstake(tokenId)`. Your NFT returns to your wallet.

**If a borrower misses their deadline:**

Call `liquidate(tokenId)`. You receive the borrower's collateral in full and the NFT is burned. This is your insurance.

---

### Guide for Borrowers

**Before you start:**
- You must have enough ERC20 to cover collateral plus borrow fee
- Check the deadline carefully — missing it costs you your collateral

**Step 1 — Browse the marketplace**

Look through available borrow listings. Each listing shows:
- Required collateral
- Borrow fee rate
- Time remaining (maximum duration you can borrow for)

**Step 2 — Choose your duration**

You can borrow for any duration up to the remaining time in the staker's lock period. Shorter duration means lower risk of forgetting to return.

**Step 3 — Borrow**

Call `borrow(tokenId, duration)`. Your ERC20 collateral and fee are deducted. The NFT arrives in your wallet.

**Step 4 — Use the asset in-game**

The NFT is in your wallet. You have full ERC721 ownership for the duration. You can use it however the game allows.

**Step 5 — Return before the deadline**

Call `returnNFT(tokenId)` before your deadline. The NFT goes back to the protocol, and your collateral is refunded in full.

**If you miss the deadline:**

Your NFT is burned and your collateral is gone permanently. The original staker receives it as compensation. Only miss the deadline intentionally if losing the NFT is worth less than the collateral you posted.

---

### Guide for Traders

**Listing your NFT:**

1. Your NFT must be in your wallet and not staked or borrowed
2. Call `listNFT(tokenId, price)` with your chosen ERC20 price
3. Your listing is immediately visible to all buyers
4. Call `updatePrice(tokenId, newPrice)` to change the price
5. Call `cancelListing(tokenId)` to delist at any time

**Buying an NFT:**

1. Find a listing you want
2. Ensure you have enough ERC20 (price amount)
3. Call `buyNFT(tokenId)`
4. ERC20 deducted, NFT arrives in your wallet instantly

**Platform fee:**
A small percentage of every sale is burned. This is deducted from the buyer's payment before the seller receives proceeds.

---

## 🔧 Under The Hood — How Diamond Contracts Work

*You do not need to understand this to use the protocol. This section is for the curious.*

Most smart contracts are a single file deployed to a single address. This works fine for simple projects but becomes a problem when:
- The contract grows too large (Ethereum has a 24KB limit per contract)
- You need to fix a bug or add a feature after deployment
- Different parts of the contract need to evolve at different speeds

**The Diamond Standard (EIP-2535)** solves this by splitting a contract into a central proxy and multiple logic modules called **facets**.

```
User calls Diamond address
          ↓
Diamond looks up which facet handles this function
          ↓
Diamond forwards the call to that facet using delegatecall
          ↓
Facet logic runs, but reads and writes Diamond's storage
          ↓
Result returns to user
```

From the outside, everything looks like one contract at one address. Inside, the logic is split across many modular facets that can be added, replaced, or removed independently.

**AppStorage — one place for all data:**

Every facet in Prism Protocol reads and writes from a single `AppStorage` struct. This is a deliberate design choice to prevent storage collisions — the most dangerous bug in upgradeable contracts. Every piece of state the protocol needs is defined upfront in one place and every facet accesses it the same way.

**Why this matters for users:**

Your NFTs, balances, staking records, and borrow positions all live at the Diamond's address permanently. If a facet is upgraded, your data is untouched — only the logic changes. This is what makes the protocol both upgradeable and trustworthy.

---

## 🧩 The Facets — What Each Module Does

| Facet | What it does |
|---|---|
| **DiamondCutFacet** | Handles protocol upgrades — adding, replacing, or removing logic modules. Only executable through multisig. |
| **DiamondLoupeFacet** | Lets anyone inspect the protocol — see which facets exist and which functions each one handles. Full transparency. |
| **OwnershipFacet** | Manages the bootstrap owner used only during initial deployment. After multisig is set up, this becomes dormant. |
| **MultisigFacet** | The governance engine. Handles proposals, approvals, and execution of all privileged protocol actions. |
| **ERC721Facet** | The gaming asset NFTs. Handles ownership, transfers, approvals, and batch minting. |
| **ERC20Facet** | The protocol currency. Standard token with mint and burn capabilities controlled by governance. |
| **SVGFacet** | Generates fully on-chain artwork for every NFT. Reads the token's unique seed and builds an SVG image with no external dependencies. |
| **StakingFacet** | Lets NFT holders lock assets for fixed periods to earn income from borrow fees. Manages stake records and reward distribution. |
| **BorrowFacet** | Lets players rent NFTs for a fixed time by posting collateral. Handles borrow listings, active borrows, returns, and liquidations. |
| **MarketplaceFacet** | Peer-to-peer NFT trading in ERC20 tokens. Handles listings, purchases, price updates, and cancellations. |

---

## 📊 Protocol Economics

| Action | Cost to user | Where it goes |
|---|---|---|
| Batch mint | Gas only (governance) | New assets to treasury |
| Buy NFT | Full listing price | Seller gets proceeds minus platform fee |
| Platform fee on sale | % of sale price | Burned permanently |
| Stake NFT | Lock NFT for X days | Earns 80% of all borrow fees on that NFT |
| Borrow NFT | Collateral + borrow fee | Collateral returned on time, fee split 80/20 |
| Return NFT on time | Nothing | Full collateral refunded |
| Miss borrow deadline | Collateral forfeited | NFT burned, staker receives collateral |
| Liquidate late borrower | Gas only | NFT burned, staker receives collateral |

---

## 🔭 Future Plans

Prism Protocol is designed to grow. The architecture makes adding new features straightforward — each addition is a new facet, not a redeployment.

### Governance Token

The current multisig model is effective for a small founding team but does not scale to a decentralized community. The next major milestone is introducing a governance token.

**How it will work:**

- Governance token holders can vote on protocol proposals
- Major decisions — like batch minting new asset supplies — will require a community vote before the multisig can execute
- Voting weight is proportional to governance token balance
- A proposal passes community vote first, then moves to the multisig for final execution

This creates a two-layer governance system:

```
Community votes on proposal (governance token)
             ↓
Vote passes threshold
             ↓
Proposal moves to multisig queue
             ↓
Multisig approvers sign
             ↓
Action executes
```

No new asset supply can be minted without both the community and the multisig agreeing. This gives token holders real power over the protocol's growth.

### Rental Guilds

Groups of asset holders pooling their NFTs into a shared staking vault. Borrow fees distributed proportionally to guild members. Ideal for gaming guilds managing large asset collections.

### Dynamic Borrow Pricing

Borrow fee rates that adjust automatically based on demand. High-demand assets cost more to borrow. Low-demand assets become cheaper to attract borrowers. All driven on-chain by utilization rate.

### Cross-Game Compatibility

Assets usable across multiple games that integrate the protocol. A weapon minted for one game could be borrowed for use in another. The NFT standard makes this possible — the protocol just needs integrations.

### Reputation System

On-chain borrower reputation scores. Borrowers who consistently return on time build a track record that unlocks lower collateral requirements. Defaulters face higher collateral requirements. All stored on-chain, all transparent.

### Fractional Ownership

Split ownership of high-value assets across multiple holders. Each holder earns a proportional share of staking rewards. Makes expensive rare assets accessible to more players.

### On-Chain Trait Upgrades

Game mechanics that allow NFT traits to evolve. An asset that has been borrowed many times could develop visual changes reflecting its history. All driven by on-chain data, no off-chain metadata updates.

### DAO Treasury Management

As the protocol treasury accumulates ERC20 revenue, governance token holders vote on how it is deployed — liquidity provision, buybacks, grants, new asset development funding.

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
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
```

### Deployment order

1. Deploy `DiamondCutFacet`
2. Deploy `Diamond` with deployer address and cut facet address
3. Deploy all remaining facets
4. Add all facets via `diamondCut`
5. Replace `tokenURI` selector to point at `SVGFacet`
6. Call `initMultisig(owners, threshold)` directly as deployer
7. All further actions go through multisig: `initERC20`, `batchMint`, `mintERC20`, `setStakeDurations`, `setBorrowFeeRate`, `setPlatformFee`
8. Optionally call `transferOwnership(address(0))` to permanently burn bootstrap privilege

---

## 🤝 Contributing

Prism Protocol is open source. Contributions are welcome — new facets, gas optimisations, test coverage, documentation improvements.

Please open an issue before submitting a pull request so the change can be discussed first.

---

## 📄 License

MIT License. See `LICENSE` for details.

---

*Built with [Foundry](https://book.getfoundry.sh/) · [EIP-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535) · Solidity ^0.8.0*

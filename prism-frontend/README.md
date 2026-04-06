# Prism Protocol — Frontend

> React + TypeScript + Wagmi + AppKit + Viem · HashKey Chain

The official frontend for Prism Protocol — a fully on-chain gaming asset ecosystem supporting NFT ownership, staking, borrowing, a marketplace, multisig governance, and a treasury — all through the Diamond (EIP-2535) proxy.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS 3 | Styling |
| Wagmi v2 | Ethereum hooks |
| Viem v2 | Low-level EVM client |
| AppKit (Reown) | Wallet connection modal |
| TanStack Query v5 | Async state & caching |
| React Router v6 | Client-side routing |
| Lucide React | Icons |

---

## Project Structure

```
src/
├── config/
│   ├── chains.ts          # HashKey Chain definition
│   ├── contracts.ts       # All ABIs + contract addresses
│   └── wagmi.ts           # Wagmi adapter + AppKit setup
├── types/
│   └── index.ts           # Shared TypeScript types
├── utils/
│   └── formatters.ts      # Token/address/time formatting helpers
├── hooks/
│   ├── useERC721.ts        # NFT read/write hooks
│   ├── useERC20.ts         # Token read/write hooks
│   ├── useMarketplace.ts   # Marketplace hooks
│   ├── useStaking.ts       # Staking hooks
│   ├── useBorrow.ts        # Borrow hooks
│   ├── useMultisig.ts      # Governance hooks
│   ├── useTreasury.ts      # Treasury hooks
│   └── useToast.ts         # Toast notification hook
├── components/
│   ├── layout/
│   │   ├── Layout.tsx      # Page wrapper + PageHeader
│   │   ├── Navbar.tsx      # Top navigation bar
│   │   └── Sidebar.tsx     # Left sidebar with nav links
│   ├── ui/
│   │   ├── Button.tsx      # Button component (5 variants)
│   │   ├── Card.tsx        # Card + CardHeader + CardTitle
│   │   ├── index.tsx       # Badge, Input, StatCard, EmptyState, Divider
│   │   ├── Modal.tsx       # Accessible modal dialog
│   │   └── Toast.tsx       # Toast notifications
│   ├── nft/
│   │   └── NFTCard.tsx     # NFT card with on-chain SVG rendering
│   ├── staking/
│   │   └── StakeModal.tsx  # Stake duration selector + approval flow
│   ├── marketplace/
│   │   └── MarketplaceModals.tsx  # List, Buy, Cancel, UpdatePrice modals
│   └── borrow/
│       └── BorrowModals.tsx       # Borrow, Return, Liquidate modals
└── pages/
    ├── Dashboard.tsx       # Protocol overview + stats
    ├── NFTsPage.tsx        # User's NFT collection
    ├── MarketplacePage.tsx # Active listings browser
    ├── StakingPage.tsx     # Stake/unstake interface
    ├── BorrowPage.tsx      # Borrow listings + active borrows
    ├── GovernancePage.tsx  # Multisig proposals + approval flow
    └── TreasuryPage.tsx    # Treasury balances + withdrawals
```

---

## Setup

### 1. Install dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Reown (WalletConnect) Project ID:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get a free Project ID at [cloud.reown.com](https://cloud.reown.com).

### 3. Start the dev server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

---

## Contract Addresses (HashKey Chain — Chain ID 177)

| Contract | Address |
|---|---|
| Diamond (proxy) | `0x6e6742bA7C02214C2B798954f1084d94E7f02b0C` |
| DiamondCutFacet | `0x376bDf7EF380D2868E80F570559a211A82061a9F` |
| DiamondLoupeFacet | `0x9A20C36A7ADE62E50C682707D2e8278d8Daf805C` |
| OwnershipFacet | `0x1b65a91a889887a65e5f59F52A161D92359E493a` |
| ERC721Facet | `0xef571eCD58Ee26e3c4Ca6bE8CAb6a88ABC58a6A7` |
| ERC20Facet | `0xe7Fa28e17bE54A8a1C30D8F6638f8c42BBC5fad2` |
| BorrowFacet | `0xc9CFdd1150F6048Ce90d215D971Ed327BC45D45A` |
| MarketplaceFacet | `0x1AE32dfD7f063a13134CDCd5C194631843e158c0` |
| StakingFacet | `0x41271490144e382B51457f2e09F6ad3eDEFC1fb8` |
| MultisigFacet | `0xF5CaeC80ab327B5D0988974d938F29DB66eFF8D7` |
| TreasuryFacet | `0xb3efE937539B09979A75D119441ed3869E899AeF` |
| VRFFacet | `0x0b6E66E0E3f1f7d35C8dD209017D30CeB303D0c3` |
| SVGFacet | `0xA2Af6b7216Cb77f00BE9D4e70d20894cBd40e8c6` |

> All interactions route through the **Diamond proxy address**. The individual facet addresses are for reference only.

---

## Design Decisions

### Diamond Pattern
All contract reads and writes target the single Diamond proxy address (`DIAMOND_ADDRESS`). The combined ABI includes every facet's functions. This mirrors how the EIP-2535 Diamond Standard works on-chain.

### NFT Ownership Scanning
The `NFTsPage` and other pages scan token IDs `1..totalSupply` and filter by ownership. For small supplies this works fine. For production scale, replace with event-based indexing (e.g. The Graph, Ponder, or a custom indexer) to avoid making thousands of RPC calls.

### On-Chain SVG Rendering
The `NFTCard` component calls `tokenURI` for each token. The response is a `data:application/json;base64,...` URI containing the on-chain SVG image. The component decodes this and renders it as an `<img>` — no IPFS or external servers needed.

### Token Approvals
ERC20 spending approvals and NFT `setApprovalForAll` approvals are handled inline inside each modal, so the flow is always: check approval → approve if needed → execute action.

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Protocol stats, quick actions, governance overview |
| `/nfts` | My NFTs | User's owned NFTs with stake/list actions |
| `/marketplace` | Marketplace | All active listings with buy/cancel/update-price |
| `/staking` | Staking | Stake NFTs to earn borrow fee income |
| `/borrow` | Borrow | Browse and borrow available NFTs with collateral |
| `/governance` | Governance | Submit proposals, approve, revoke, execute |
| `/treasury` | Treasury | View treasury balances; withdraw (multisig owners only) |

---

## AppKit (Reown) Configuration

AppKit is initialized in `src/config/wagmi.ts`. The HashKey Chain is pre-configured as the sole network. AppKit's `<w3m-button />` web component is used in the Navbar and on connect-prompt screens.

To add more chains, extend the `networks` array in `wagmi.ts` and import them from `viem/chains` or define custom chains.

---

## Fonts

- **Exo 2** — Display / headings (`.font-display`)
- **DM Sans** — Body text (default)

Both are loaded from Google Fonts in `index.css`.

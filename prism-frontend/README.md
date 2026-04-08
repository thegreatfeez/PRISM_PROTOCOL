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
| Node + Express (optional) | Local AI proxy for Gemini (`server/`) |

---

## Layout & navigation

- **Primary navigation** is the **left sidebar** (Dashboard, My NFTs, Marketplace, Staking, Borrow, and **Governance** / **Treasury** for multisig signers and contract owner).
- **Governance** and **Treasury** are shown only to **signers** (multisig owners, on-chain `owner()`, or optional env override — see Environment variables).
- There is **no full top navigation bar**. **WalletConnect** (`<w3m-button />`) appears in the **top-right** corner and again in the **sidebar** wallet section when connected.
- **Protocol guide (AI)** — floating **“Protocol guide”** button (bottom-right) on all pages; opens a chat that answers questions about the protocol and UI. Requires the optional AI proxy (see [AI integration](#ai-integration)).

---

## Project Structure

```
src/
├── config/
│   ├── ai.ts               # Shared AI proxy base URL helper
│   ├── chains.ts           # HashKey Chain definition + block explorer
│   ├── contracts.ts        # All ABIs + contract addresses
│   └── wagmi.ts            # Wagmi adapter + AppKit setup
├── services/
│   ├── aiAssistant.ts      # Protocol Q&A → POST /protocol-assistant
│   └── aiGovernance.ts     # Proposal summary → POST /governance-summary
├── types/
│   └── index.ts            # Shared TypeScript types
├── utils/
│   └── formatters.ts       # Token/address/time + explorer URL helpers
├── hooks/
│   ├── useERC721.ts        # NFT read/write hooks
│   ├── useERC20.ts         # Token read/write hooks
│   ├── useMarketplace.ts   # Marketplace hooks
│   ├── useStaking.ts       # Staking hooks
│   ├── useBorrow.ts        # Borrow hooks
│   ├── useMultisig.ts      # Governance hooks
│   ├── useTreasury.ts      # Treasury hooks
│   ├── useRole.ts          # Signer vs user (owner + multisig + optional env)
│   └── useToast.ts         # Toast notification hook
├── components/
│   ├── ai/
│   │   └── ProtocolAssistant.tsx  # Global AI chat modal
│   ├── layout/
│   │   ├── Layout.tsx      # Sidebar + top-right wallet + Protocol guide
│   │   ├── Navbar.tsx      # Legacy top bar (not mounted in Layout)
│   │   └── Sidebar.tsx     # Nav, wallet, contract explorer link
│   ├── ui/
│   │   ├── AccessGate.tsx  # Route-level role gating
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
    ├── NFTsPage.tsx        # NFT collection + mint (signers)
    ├── MarketplacePage.tsx # Active listings browser
    ├── StakingPage.tsx     # Stake/unstake interface
    ├── BorrowPage.tsx      # Borrow listings + active borrows
    ├── GovernancePage.tsx  # Multisig + AI proposal summary
    └── TreasuryPage.tsx    # Treasury balances + withdrawals

server/                     # Optional Node proxy for Gemini (API key stays server-side)
├── package.json
└── index.mjs               # POST /protocol-assistant, POST /governance-summary

AI.md                       # Detailed AI setup, testing, and troubleshooting
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

### 2. Environment variables

Copy and edit `.env` (see your team’s `.env.example` if present).

**Required for the web app**

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get a Project ID at [cloud.reown.com](https://cloud.reown.com).

**Optional**

```env
# Treat this wallet as signer (UI) in addition to on-chain checks
VITE_DEFAULT_SIGNER_ADDRESS=0x...

# AI proxy origin (same server serves both protocol chat and governance summary)
VITE_AI_BASE_URL=http://localhost:8787
```

If you omit `VITE_AI_BASE_URL`, you can use the older name `VITE_AI_GOVERNANCE_URL` with the same value. `VITE_AI_BASE_URL` takes precedence when both are set.

Restart `npm run dev` after changing any `VITE_*` variable.

### 3. Optional: AI proxy (Gemini)

The browser never stores your Gemini key. Run the small server when using AI features:

```bash
cd server
npm install
```

Set env in `prism-frontend/.env` (recommended) or root `.env`:

```env
GEMINI_API_KEY=your_key_here
# optional:
GEMINI_MODEL=gemini-2.5-flash
PORT=8787
```

If `GEMINI_MODEL` is unavailable, the proxy automatically falls back to other supported flash models.

Start the proxy:

```bash
npm start
```

In another terminal, start the frontend:

```bash
npm run dev
```

Full details, endpoints, and testing steps: **[AI.md](./AI.md)**.

### 4. Build for production

```bash
npm run build
```

---

## AI integration

| Feature | Where | Backend route |
|--------|--------|----------------|
| **Protocol guide** | Floating **Protocol guide** (bottom-right) | `POST /protocol-assistant` |
| **Governance proposal summary** | Governance → expand proposal → **Generate AI analysis** | `POST /governance-summary` |

Both are implemented in `server/index.mjs` and documented in **[AI.md](./AI.md)**.

---

## Block explorer

Address and transaction links use the **HashKey testnet explorer**:

`https://testnet-explorer.hsk.xyz`

(Configured in `src/utils/formatters.ts` and `src/config/chains.ts`.)

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

### Access control
`useRole` treats a wallet as a **signer** if it is a multisig owner, the on-chain contract **owner**, or (optionally) matches `VITE_DEFAULT_SIGNER_ADDRESS`. **Governance** and **Treasury** routes use `AccessGate` for signer-only pages; sidebar links for those pages are hidden for non-signers.

### NFT Ownership Scanning
The `NFTsPage` and related views scan token IDs from `0` to `totalSupply - 1` (or equivalent range) and batch-read owners where applicable. For very large supplies, consider event-based indexing (e.g. The Graph, Ponder) instead of full scans.

### On-Chain SVG Rendering
The `NFTCard` component calls `tokenURI` for each token. The response is a `data:application/json;base64,...` URI containing the on-chain SVG image. The component decodes this and renders it as an `<img>` — no IPFS or external servers needed.

### Token Approvals
ERC20 spending approvals and NFT `setApprovalForAll` approvals are handled inline inside each modal, so the flow is always: check approval → approve if needed → execute action.

### AI safety
AI output is **informational only**. It does not sign transactions. Users must confirm every action in the wallet.

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Protocol stats, quick actions, governance overview |
| `/nfts` | My NFTs | Collection view; mint/batch mint for signers |
| `/marketplace` | Marketplace | Active listings with buy/cancel/update-price |
| `/staking` | Staking | Stake/unstake interface |
| `/borrow` | Borrow | Browse and borrow available NFTs with collateral |
| `/governance` | Governance | Multisig proposals; **AI proposal summary** when expanded |
| `/treasury` | Treasury | Treasury balances; withdrawals (signers) |

---

## AppKit (Reown) Configuration

AppKit is initialized in `src/config/wagmi.ts`. The HashKey Chain is pre-configured as the sole network. AppKit web components (`<w3m-button />`, `<w3m-account-button />`) are used in the layout and connect prompts.

To add more chains, extend the `networks` array in `wagmi.ts` and import them from `viem/chains` or define custom chains.

---

## Fonts

- **Exo 2** — Display / headings (`.font-display`)
- **DM Sans** — Body text (default)

Both are loaded from Google Fonts in `index.css`.

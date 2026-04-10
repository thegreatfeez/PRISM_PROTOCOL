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

## Contract Addresses (HashKey Chain — Chain ID 133)

| Contract | Address |
|---|---|
| Diamond (proxy) | `0x5A9E09a12f3513F72161976818e87574bf9aD1E1` |
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
| FaucetFacet | `0xF8d827ab460371E1161AAed013f4519a11986219` |

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

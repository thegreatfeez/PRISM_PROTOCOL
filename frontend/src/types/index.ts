// ─── NFT Types ──────────────────────────────────────────────────────────────

export interface TokenData {
  attack: number;
  defense: number;
  mage: boolean;
  requestId: bigint;
}

export interface NFT {
  tokenId: bigint;
  owner: string;
  tokenData: TokenData;
  tokenURI?: string;
}

export type TraitType = "Attack" | "Defense" | "Mage";

// ─── Marketplace Types ───────────────────────────────────────────────────────

export interface Listing {
  tokenId: bigint;
  seller: string;
  price: bigint;
  active: boolean;
}

// ─── Staking Types ───────────────────────────────────────────────────────────

export interface StakeInfo {
  staker: string;
  stakeExpiry: bigint;
  rewardBps: bigint;
}

export interface StakeDuration {
  duration: bigint;
  rewardBps: bigint;
  label: string;
}

// ─── Borrow Types ────────────────────────────────────────────────────────────

export interface BorrowInfo {
  borrower: string;
  lender: string;
  collateralEth: bigint;
  deadline: bigint;
}

export interface BorrowListing {
  owner: string;
  price: bigint;
  duration: bigint;
  active: boolean;
}

// ─── Multisig Types ──────────────────────────────────────────────────────────

export interface Proposal {
  id: bigint;
  proposer: string;
  callData: string;
  approvalCount: bigint;
  executed: boolean;
}

// ─── UI State Types ──────────────────────────────────────────────────────────

export type ModalType =
  | "stake"
  | "unstake"
  | "list"
  | "buy"
  | "borrow"
  | "return"
  | "liquidate"
  | "propose"
  | "withdraw"
  | null;

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
}

import { useState, useEffect } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/index";
import { useListNFT, useBuyNFT, useCancelListing, useUpdatePrice, usePlatformFee, useListing } from "../../hooks/useMarketplace";
import { useIsApprovedForAll, useSetApprovalForAll } from "../../hooks/useERC721";
import { useTokenBalance } from "../../hooks/useERC20";
import { DIAMOND_ADDRESS } from "../../config/contracts";
import { formatToken, formatBps } from "../../utils/formatters";
import { useStakeInfo } from "../../hooks/useStaking";
import { useBorrowInfo } from "../../hooks/useBorrow";

// ─── List NFT Modal ──────────────────────────────────────────────────────────

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint | null;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ListNFTModal({ isOpen, onClose, tokenId, onSuccess, onError }: ListModalProps) {
  const { address } = useAccount();
  const [price, setPrice] = useState("");

  const { data: listingState } = useListing(tokenId ?? undefined);
  const { data: stake } = useStakeInfo(tokenId ?? undefined);
  const { data: borrow } = useBorrowInfo(tokenId ?? undefined);

  const { data: isApproved, refetch: refetchApproval } = useIsApprovedForAll(address, DIAMOND_ADDRESS);
  const { setApprovalForAll, isPending: approving, isSuccess: approvalDone } = useSetApprovalForAll();
  const { listNFT, isPending: listing, isSuccess: listed } = useListNFT();
  const { data: platformFee } = usePlatformFee();

  useEffect(() => { if (approvalDone) refetchApproval(); }, [approvalDone]);
  useEffect(() => {
    if (listed) {
      onSuccess(`NFT #${tokenId} listed!`);
      onClose();
    }
  }, [listed]);

  const handleList = () => {
    if (!tokenId || !price) return;
    try {
      listNFT(tokenId, parseUnits(price, 18));
    } catch {
      onError("Invalid price.");
    }
  };

  if (!tokenId) return null;

  const isAlreadyListed = Boolean(listingState?.[2]);
  const isStaked = !!stake && stake[0] !== "0x0000000000000000000000000000000000000000";
  const isBorrowed = !!borrow && borrow[0] !== "0x0000000000000000000000000000000000000000";
  const blockedReason = isAlreadyListed
    ? "This NFT is already listed."
    : isBorrowed
      ? "This NFT is currently borrowed."
      : isStaked
        ? "This NFT is currently staked."
        : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`List NFT #${tokenId}`} subtitle="Sell your NFT on the marketplace">
      <div className="space-y-4">
        {blockedReason && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
            <p className="font-semibold">Cannot list</p>
            <p className="mt-1">{blockedReason}</p>
          </div>
        )}

        <Input
          label="Listing Price"
          placeholder="0.00"
          type="number"
          min="0"
          step="any"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          suffix="PRM"
        />

        {platformFee !== undefined && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            <p className="font-semibold mb-1">Platform Fee</p>
            <p>A {formatBps(platformFee as bigint)} fee is burned on every sale, reducing total token supply.</p>
          </div>
        )}

        {!isApproved && (
          <Button fullWidth variant="secondary" loading={approving} onClick={() => setApprovalForAll(DIAMOND_ADDRESS, true)}>
            Approve NFT Access
          </Button>
        )}

        <Button
          fullWidth
          variant="primary"
          loading={listing}
          disabled={!isApproved || !price || listing || !!blockedReason}
          onClick={handleList}
          title={blockedReason || undefined}
        >
          {!isApproved ? "Approve First" : "List NFT"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Buy NFT Modal ───────────────────────────────────────────────────────────

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint | null;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function BuyNFTModal({ isOpen, onClose, tokenId, onSuccess, onError }: BuyModalProps) {
  const { address } = useAccount();
  const { data: listing } = useListing(tokenId ?? undefined);
  const { data: balance } = useTokenBalance(address);
  const { buyNFT, isPending: buying, isSuccess: bought } = useBuyNFT();

  const price = listing?.[1] ?? 0n;
  const hasEnoughBalance = balance !== undefined && (balance as bigint) >= price;

  useEffect(() => {
    if (bought) {
      onSuccess(`NFT #${tokenId} purchased!`);
      onClose();
    }
  }, [bought]);

  if (!tokenId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Buy NFT #${tokenId}`} subtitle="Purchase this asset with PRM tokens">
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Price</span>
            <span className="font-semibold text-slate-800">{formatToken(price)} PRM</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Your Balance</span>
            <span className={`font-medium ${hasEnoughBalance ? "text-emerald-600" : "text-rose-500"}`}>
              {balance !== undefined ? formatToken(balance as bigint) : "—"} PRM
            </span>
          </div>
        </div>

        {!hasEnoughBalance && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-600">
            Insufficient PRM balance to purchase this NFT.
          </div>
        )}

        {hasEnoughBalance && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600">
            This protocol uses an internal PRM balance ledger (not ERC20 `transferFrom`), so no token spending approval is required to buy.
          </div>
        )}

        <Button fullWidth variant="primary" loading={buying} disabled={!hasEnoughBalance || buying} onClick={() => buyNFT(tokenId)}>
          {!hasEnoughBalance ? "Insufficient Balance" : "Confirm Purchase"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Cancel Listing Modal ─────────────────────────────────────────────────────

interface CancelListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint | null;
  onSuccess: (msg: string) => void;
}

export function CancelListingModal({ isOpen, onClose, tokenId, onSuccess }: CancelListingModalProps) {
  const { cancelListing, isPending, isSuccess } = useCancelListing();

  useEffect(() => {
    if (isSuccess) {
      onSuccess(`Listing for NFT #${tokenId} cancelled.`);
      onClose();
    }
  }, [isSuccess]);

  if (!tokenId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Listing" subtitle={`Remove NFT #${tokenId} from the marketplace`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Are you sure you want to cancel this listing? The NFT will be returned to your wallet and removed from sale.
        </p>
        <div className="flex gap-3">
          <Button fullWidth variant="ghost" onClick={onClose}>Cancel</Button>
          <Button fullWidth variant="danger" loading={isPending} onClick={() => cancelListing(tokenId)}>
            Remove Listing
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Update Price Modal ───────────────────────────────────────────────────────

interface UpdatePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint | null;
  currentPrice: bigint;
  onSuccess: (msg: string) => void;
}

export function UpdatePriceModal({ isOpen, onClose, tokenId, currentPrice, onSuccess }: UpdatePriceModalProps) {
  const [newPrice, setNewPrice] = useState(formatToken(currentPrice));
  const { updatePrice, isPending, isSuccess } = useUpdatePrice();

  useEffect(() => {
    if (isSuccess) {
      onSuccess(`Price updated for NFT #${tokenId}.`);
      onClose();
    }
  }, [isSuccess]);

  if (!tokenId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Price" subtitle={`Change the listing price for NFT #${tokenId}`}>
      <div className="space-y-4">
        <Input
          label="New Price"
          type="number" min="0" step="any"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          suffix="PRM"
        />
        <Button
          fullWidth variant="primary" loading={isPending}
          disabled={!newPrice || isPending}
          onClick={() => updatePrice(tokenId, parseUnits(newPrice, 18))}
        >
          Update Price
        </Button>
      </div>
    </Modal>
  );
}

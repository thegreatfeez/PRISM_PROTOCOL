import { useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useBorrowNFT, useReturnNFT, useLiquidate, useRequiredCollateral, useBorrowInfo, useBorrowListing } from "../../hooks/useBorrow";
import { useTokenBalance } from "../../hooks/useERC20";
import { useAccount } from "wagmi";
import { formatToken, formatEth, formatDeadline, timeRemaining, isExpired } from "../../utils/formatters";

// ─── Borrow Modal ─────────────────────────────────────────────────────────────

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint | null;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function BorrowModal({ isOpen, onClose, tokenId, onSuccess, onError }: BorrowModalProps) {
  const { address } = useAccount();
  const { data: listing } = useBorrowListing(tokenId ?? undefined);
  const { data: collateral, isLoading: collateralLoading } = useRequiredCollateral(tokenId ?? undefined);
  const { data: balance } = useTokenBalance(address);
  const { borrow, isPending: borrowing, isSuccess: borrowed } = useBorrowNFT();

  const borrowPrice = listing?.[1] ?? 0n;
  const duration = listing?.[2] ?? 0n;
  const collateralAmount = (collateral as bigint) ?? 0n;

  const hasEnoughBalance = balance !== undefined && (balance as bigint) >= borrowPrice;

  useEffect(() => {
    if (borrowed) {
      onSuccess(`NFT #${tokenId} borrowed!`);
      onClose();
    }
  }, [borrowed]);

  if (!tokenId) return null;

  const durationDays = Number(duration) / 86400;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Borrow NFT #${tokenId}`} subtitle="Rent this asset by posting collateral">
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Borrow Fee</span>
            <span className="font-semibold text-slate-800">{formatToken(borrowPrice)} PRM</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Duration</span>
            <span className="font-semibold text-slate-800">{durationDays.toFixed(0)} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">ETH Collateral</span>
            <span className="font-semibold text-sky-700">
              {collateralLoading ? "Loading…" : `${formatEth(collateralAmount)} HSK`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Your PRM Balance</span>
            <span className="font-medium text-slate-600">
              {balance !== undefined ? formatToken(balance as bigint) : "—"} PRM
            </span>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs text-sky-700 space-y-1">
          <p className="font-semibold">How Borrowing Works</p>
          <p>• Pay the borrow fee in PRM tokens upfront</p>
          <p>• Post ETH collateral (returned when you return the NFT)</p>
          <p>• Return before the deadline to reclaim collateral</p>
          <p>• Miss deadline → NFT burned, collateral forfeited</p>
        </div>

        {!hasEnoughBalance && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
            Insufficient PRM balance to pay the borrow fee.
          </div>
        )}

        <Button
          fullWidth variant="primary" loading={borrowing}
          disabled={!hasEnoughBalance || borrowing || collateralLoading}
          onClick={() => borrow(tokenId, duration, collateralAmount)}
        >
          {!hasEnoughBalance ? "Insufficient Balance" : "Borrow NFT"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Return NFT Modal ─────────────────────────────────────────────────────────

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint | null;
  onSuccess: (msg: string) => void;
}

export function ReturnNFTModal({ isOpen, onClose, tokenId, onSuccess }: ReturnModalProps) {
  const { data: borrowInfo } = useBorrowInfo(tokenId ?? undefined);
  const { returnNFT, isPending, isSuccess } = useReturnNFT();

  const deadline = borrowInfo?.[3] ?? 0n;
  const collateral = borrowInfo?.[2] ?? 0n;
  const expired = isExpired(deadline);

  useEffect(() => {
    if (isSuccess) {
      onSuccess(`NFT #${tokenId} returned — collateral refunded!`);
      onClose();
    }
  }, [isSuccess]);

  if (!tokenId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Return NFT #${tokenId}`} subtitle="Return the asset to reclaim your collateral">
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Collateral to Reclaim</span>
            <span className="font-semibold text-emerald-600">{formatEth(collateral)} HSK</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Deadline</span>
            <span className={`font-medium ${expired ? "text-rose-500" : "text-slate-800"}`}>
              {formatDeadline(deadline)}
            </span>
          </div>
          {deadline > 0n && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${expired ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                {expired ? "⚠ Overdue" : timeRemaining(deadline)}
              </span>
            </div>
          )}
        </div>

        {expired && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
            <p className="font-semibold">Deadline passed</p>
            <p className="mt-1">You may still return the NFT but you may lose your collateral. Anyone can now liquidate this position.</p>
          </div>
        )}

        <Button fullWidth variant={expired ? "danger" : "primary"} loading={isPending}
          onClick={() => returnNFT(tokenId)}>
          Return NFT & Reclaim Collateral
        </Button>
      </div>
    </Modal>
  );
}

// ─── Liquidate Modal ──────────────────────────────────────────────────────────

interface LiquidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint | null;
  onSuccess: (msg: string) => void;
}

export function LiquidateModal({ isOpen, onClose, tokenId, onSuccess }: LiquidateModalProps) {
  const { liquidate, isPending, isSuccess } = useLiquidate();

  useEffect(() => {
    if (isSuccess) {
      onSuccess(`NFT #${tokenId} liquidated — collateral distributed!`);
      onClose();
    }
  }, [isSuccess]);

  if (!tokenId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Liquidate Position" subtitle={`Liquidate overdue borrow for NFT #${tokenId}`}>
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 space-y-1">
          <p className="font-semibold">What happens on liquidation?</p>
          <p>• The NFT is permanently burned</p>
          <p>• 80% of ETH collateral goes to the staker/lender</p>
          <p>• 20% of ETH collateral goes to the protocol treasury</p>
          <p>• The borrower loses their collateral</p>
        </div>
        <div className="flex gap-3">
          <Button fullWidth variant="ghost" onClick={onClose}>Cancel</Button>
          <Button fullWidth variant="danger" loading={isPending} onClick={() => liquidate(tokenId)}>
            Liquidate
          </Button>
        </div>
      </div>
    </Modal>
  );
}

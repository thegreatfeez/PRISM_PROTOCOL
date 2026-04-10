import { useState } from "react";
import { useAccount } from "wagmi";
import { Repeat2, AlertTriangle } from "lucide-react";
import { AppKitButton } from "@reown/appkit/react";
import { PageHeader } from "../components/layout/Layout";
import { NFTCard } from "../components/nft/NFTCard";
import { BorrowModal, ReturnNFTModal, LiquidateModal } from "../components/borrow/BorrowModals";
import { EmptyState, Badge } from "../components/ui/index";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useBorrowListing, useBorrowInfo } from "../hooks/useBorrow";
import { useTotalSupply } from "../hooks/useERC721";
import { formatToken, formatDeadline, formatEth, timeRemaining, isExpired } from "../utils/formatters";

// Card for a borrow-available NFT (staked by someone)
function BorrowAvailableCard({
  tokenId,
  userAddress,
  onBorrow,
  onReturn,
  onLiquidate,
}: {
  tokenId: bigint;
  userAddress?: string;
  onBorrow: (id: bigint) => void;
  onReturn: (id: bigint) => void;
  onLiquidate: (id: bigint) => void;
}) {
  const { data: listing } = useBorrowListing(tokenId);
  const { data: borrowInfo } = useBorrowInfo(tokenId);

  const isListingActive = listing?.[3] ?? false;
  const listingOwner = listing?.[0] ?? "";
  const borrower = borrowInfo?.[0] ?? "";
  const lender = borrowInfo?.[1] ?? "";
  const deadline = borrowInfo?.[3] ?? 0n;
  const price = listing?.[1] ?? 0n;
  const duration = listing?.[2] ?? 0n;

  const zero = "0x0000000000000000000000000000000000000000";
  const isActiveBorrow = borrower !== zero;
  const isMyBorrow = isActiveBorrow && borrower.toLowerCase() === (userAddress ?? "").toLowerCase();
  const isLender =
    !!userAddress && lender.toLowerCase() !== zero && lender.toLowerCase() === userAddress.toLowerCase();
  const isBorrowListingOwner =
    !!userAddress && listingOwner.toLowerCase() !== zero && listingOwner.toLowerCase() === userAddress.toLowerCase();
  const expired = isExpired(deadline);

  // Show if available to borrow, or if it's my active borrow, or if it's an expired borrow (liquidatable)
  if (!isListingActive && !isActiveBorrow) return null;

  const durationDays = Number(duration) / 86400;

  return (
    <div className="flex flex-col gap-0">
      <NFTCard
        tokenId={tokenId}
        showOwner
        actionLabel={
          isMyBorrow && !expired
            ? "Return"
            : isActiveBorrow && expired && isLender
              ? "Liquidate"
              : isListingActive && !isActiveBorrow && !isBorrowListingOwner
                ? "Borrow"
                : undefined
        }
        onAction={
          isMyBorrow && !expired
            ? () => onReturn(tokenId)
            : isActiveBorrow && expired && isLender
              ? () => onLiquidate(tokenId)
              : isListingActive && !isActiveBorrow && !isBorrowListingOwner
                ? () => onBorrow(tokenId)
                : undefined
        }
      />
      <div className={`mt-1 rounded-xl px-3 py-2 text-xs space-y-1 ${
        isActiveBorrow
          ? expired ? "bg-rose-50 border border-rose-100" : "bg-amber-50 border border-amber-100"
          : "bg-sky-50 border border-sky-100"
      }`}>
        {isActiveBorrow ? (
          <>
            <div className="flex justify-between">
              <span className="text-slate-500">Deadline</span>
              <span className={`font-medium ${expired ? "text-rose-600" : "text-amber-700"}`}>
                {formatDeadline(deadline)}
              </span>
            </div>
            {deadline > 0n && (
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`font-medium text-xs ${expired ? "text-rose-600" : "text-emerald-600"}`}>
                  {expired ? "⚠ Overdue" : timeRemaining(deadline)}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="text-slate-500">Fee</span>
              <span className="font-medium text-sky-700">{formatToken(price)} PRM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Duration</span>
              <span className="font-medium text-slate-700">{durationDays.toFixed(0)} days</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function BorrowPage() {
  const { address, isConnected } = useAccount();
  const { data: totalSupply } = useTotalSupply();
  const { toasts, success, error, removeToast } = useToast();

  const [borrowModal, setBorrowModal] = useState<bigint | null>(null);
  const [returnModal, setReturnModal] = useState<bigint | null>(null);
  const [liquidateModal, setLiquidateModal] = useState<bigint | null>(null);

  const allIds = totalSupply
    ? Array.from({ length: Number(totalSupply) }, (_, i) => BigInt(i))
    : [];

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <p className="text-slate-500">Connect your wallet to browse borrow listings.</p>
        <AppKitButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrow"
        subtitle="Rent gaming assets using ETH collateral + PRM fee"
      />

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card accent="sky">
          <CardHeader>
            <CardTitle>How Borrowing Works</CardTitle>
          </CardHeader>
          <div className="space-y-2 text-sm text-slate-500">
            {[
              "Pay the borrow fee in PRM tokens",
              "Post ETH as collateral (returned on time return)",
              "Use the asset until the deadline",
              "Return before deadline → full collateral back",
              "Miss deadline → NFT burned, collateral forfeited",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card accent="amber">
          <CardHeader>
            <CardTitle>Liquidation</CardTitle>
            <Badge color="amber" dot>Important</Badge>
          </CardHeader>
          <div className="space-y-2 text-sm text-slate-500">
            <p>If a borrower misses their deadline, anyone can liquidate the position:</p>
            <div className="bg-amber-50 rounded-xl p-3 space-y-1 text-xs">
              <p>• NFT is permanently burned</p>
              <p>• 80% of ETH collateral → staker/lender</p>
              <p>• 20% of ETH collateral → protocol treasury</p>
            </div>
            <p className="text-xs">Look for <Badge color="rose" size="sm">Overdue</Badge> listings to liquidate.</p>
          </div>
        </Card>
      </div>

      {/* Browse listings */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Available Borrow Listings
        </h2>

        {allIds.length === 0 ? (
          <EmptyState
            icon={<Repeat2 size={48} />}
            title="No borrow listings"
            description="Staked NFTs appear here as available to borrow."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allIds.map((id) => (
              <BorrowAvailableCard
                key={id.toString()}
                tokenId={id}
                userAddress={address}
                onBorrow={(tid) => setBorrowModal(tid)}
                onReturn={(tid) => setReturnModal(tid)}
                onLiquidate={(tid) => setLiquidateModal(tid)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BorrowModal
        isOpen={borrowModal !== null}
        onClose={() => setBorrowModal(null)}
        tokenId={borrowModal}
        onSuccess={(msg) => success("Borrowed!", msg)}
        onError={(msg) => error("Error", msg)}
      />

      <ReturnNFTModal
        isOpen={returnModal !== null}
        onClose={() => setReturnModal(null)}
        tokenId={returnModal}
        onSuccess={(msg) => success("Returned!", msg)}
      />

      <LiquidateModal
        isOpen={liquidateModal !== null}
        onClose={() => setLiquidateModal(null)}
        tokenId={liquidateModal}
        onSuccess={(msg) => success("Liquidated!", msg)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

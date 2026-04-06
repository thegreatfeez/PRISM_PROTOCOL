import { useState } from "react";
import { useAccount } from "wagmi";
import { ShoppingCart, Tag, RefreshCw } from "lucide-react";
import { PageHeader } from "../components/layout/Layout";
import { NFTCard } from "../components/nft/NFTCard";
import { BuyNFTModal, CancelListingModal, UpdatePriceModal } from "../components/marketplace/MarketplaceModals";
import { EmptyState, Badge } from "../components/ui/index";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useTotalSupply, useOwnerOf } from "../hooks/useERC721";
import { useListing, usePlatformFee } from "../hooks/useMarketplace";
import { formatToken, formatBps } from "../utils/formatters";

// Check if a specific token is listed
function MarketplaceNFTCard({
  tokenId,
  userAddress,
  onBuy,
  onCancel,
  onUpdatePrice,
}: {
  tokenId: bigint;
  userAddress?: string;
  onBuy: (id: bigint) => void;
  onCancel: (id: bigint, price: bigint) => void;
  onUpdatePrice: (id: bigint, price: bigint) => void;
}) {
  const { data: listing } = useListing(tokenId);
  const { data: owner } = useOwnerOf(tokenId);

  const isListed = listing?.[2] ?? false;
  if (!isListed) return null;

  const seller = listing?.[0] ?? "";
  const price = listing?.[1] ?? 0n;
  const isOwner = seller.toLowerCase() === (userAddress ?? "").toLowerCase();

  return (
    <NFTCard
      tokenId={tokenId}
      showOwner
      actionLabel={isOwner ? "Update Price" : "Buy"}
      secondaryActionLabel={isOwner ? "Cancel" : undefined}
      onAction={isOwner ? () => onUpdatePrice(tokenId, price) : () => onBuy(tokenId)}
      onSecondaryAction={isOwner ? () => onCancel(tokenId, price) : undefined}
    />
  );
}

export function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const { data: totalSupply, refetch } = useTotalSupply();
  const { data: platformFee } = usePlatformFee();
  const { toasts, success, error, removeToast } = useToast();

  const [buyModal, setBuyModal] = useState<bigint | null>(null);
  const [cancelModal, setCancelModal] = useState<{ id: bigint; price: bigint } | null>(null);
  const [updateModal, setUpdateModal] = useState<{ id: bigint; price: bigint } | null>(null);

  const allIds = totalSupply
    ? Array.from({ length: Number(totalSupply) }, (_, i) => BigInt(i + 1))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        subtitle="Buy and sell gaming assets with PRM tokens"
        action={
          <div className="flex items-center gap-3">
            {platformFee !== undefined && (
              <Badge color="amber" size="sm">
                {formatBps(platformFee as bigint)} fee burned on sale
              </Badge>
            )}
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* Info banner */}
      <div className="bg-gradient-to-r from-sky-50 to-violet-50 rounded-2xl border border-sky-100 p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Tag size={16} className="text-sky-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Peer-to-peer NFT trading</p>
          <p className="text-xs text-slate-500 mt-0.5">
            All transactions use PRM tokens. A portion of every sale is permanently burned — making your tokens more valuable over time.
          </p>
        </div>
      </div>

      {/* Listings grid */}
      {!isConnected ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-slate-500 text-sm">Connect to browse the marketplace.</p>
          <w3m-button />
        </div>
      ) : allIds.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="No active listings"
          description="Be the first to list a gaming asset on the marketplace."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allIds.map((id) => (
            <MarketplaceNFTCard
              key={id.toString()}
              tokenId={id}
              userAddress={address}
              onBuy={(tid) => setBuyModal(tid)}
              onCancel={(tid, price) => setCancelModal({ id: tid, price })}
              onUpdatePrice={(tid, price) => setUpdateModal({ id: tid, price })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <BuyNFTModal
        isOpen={buyModal !== null}
        onClose={() => setBuyModal(null)}
        tokenId={buyModal}
        onSuccess={(msg) => success("Purchased!", msg)}
        onError={(msg) => error("Error", msg)}
      />

      <CancelListingModal
        isOpen={cancelModal !== null}
        onClose={() => setCancelModal(null)}
        tokenId={cancelModal?.id ?? null}
        onSuccess={(msg) => success("Cancelled", msg)}
      />

      <UpdatePriceModal
        isOpen={updateModal !== null}
        onClose={() => setUpdateModal(null)}
        tokenId={updateModal?.id ?? null}
        currentPrice={updateModal?.price ?? 0n}
        onSuccess={(msg) => success("Updated!", msg)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

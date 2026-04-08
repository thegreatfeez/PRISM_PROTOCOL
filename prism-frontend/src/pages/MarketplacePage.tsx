import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ShoppingCart, Tag, RefreshCw, Filter, Image } from "lucide-react";
import { AppKitButton } from "@reown/appkit/react";
import { PageHeader } from "../components/layout/Layout";
import { NFTCard } from "../components/nft/NFTCard";
import { BuyNFTModal, CancelListingModal, UpdatePriceModal, ListNFTModal } from "../components/marketplace/MarketplaceModals";
import { StakeModal } from "../components/staking/StakeModal";
import { EmptyState, Badge } from "../components/ui/index";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useTotalSupply, useOwnerOf } from "../hooks/useERC721";
import { useListing, usePlatformFee } from "../hooks/useMarketplace";
import { formatToken, formatBps } from "../utils/formatters";
import { useReadContracts } from "wagmi";
import { useSearchParams } from "react-router-dom";
import { DIAMOND_ADDRESS, ERC721_ABI } from "../config/contracts";

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

type MarketplaceView = "market" | "nfts";
type NFTFilter = "all" | "mine";

function useAllOwners(tokenIds: bigint[]) {
  const contracts = useMemo(
    () =>
      tokenIds.map((id) => ({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: ERC721_ABI,
        functionName: "ownerOf" as const,
        args: [id] as const,
      })),
    [tokenIds]
  );

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: tokenIds.length > 0 },
  });

  const ownerMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data) {
      data.forEach((result, i) => {
        if (result.status === "success" && result.result) {
          map.set(tokenIds[i].toString(), result.result as string);
        }
      });
    }
    return map;
  }, [data, tokenIds]);

  return { ownerMap, isLoading, refetch };
}

export function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const { data: totalSupply, refetch } = useTotalSupply();
  const { data: platformFee } = usePlatformFee();
  const { toasts, success, error, removeToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [buyModal, setBuyModal] = useState<bigint | null>(null);
  const [cancelModal, setCancelModal] = useState<{ id: bigint; price: bigint } | null>(null);
  const [updateModal, setUpdateModal] = useState<{ id: bigint; price: bigint } | null>(null);
  const [stakeModal, setStakeModal] = useState<bigint | null>(null);
  const [listModal, setListModal] = useState<bigint | null>(null);

  const allIds = totalSupply
    ? Array.from({ length: Number(totalSupply) }, (_, i) => BigInt(i))
    : [];

  const view = (searchParams.get("view") as MarketplaceView) || "market";
  const nftFilter = (searchParams.get("filter") as NFTFilter) || "mine";

  const setView = (next: MarketplaceView) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", next);
    if (next === "nfts" && !nextParams.get("filter")) nextParams.set("filter", "mine");
    setSearchParams(nextParams, { replace: true });
  };

  const setNFTFilter = (next: NFTFilter) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", "nfts");
    nextParams.set("filter", next);
    setSearchParams(nextParams, { replace: true });
  };

  // NFT ownership view (collection)
  const { ownerMap, isLoading: ownersLoading, refetch: refetchOwners } = useAllOwners(allIds);
  const myIds = useMemo(() => {
    if (!address) return [];
    return allIds.filter((id) => ownerMap.get(id.toString())?.toLowerCase() === address.toLowerCase());
  }, [allIds, ownerMap, address]);
  const displayNFTIds = view !== "nfts"
    ? []
    : nftFilter === "mine"
      ? myIds
      : allIds;

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

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setView("market")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                view === "market" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              Listings
            </button>
            <button
              onClick={() => setView("nfts")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                view === "nfts" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              NFTs
            </button>
          </div>
          {view === "nfts" && <Filter size={13} className="text-slate-300" />}
        </div>

        {view === "nfts" && (
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setNFTFilter("all")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                nftFilter === "all" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              All ({allIds.length})
            </button>
            <button
              onClick={() => setNFTFilter("mine")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                nftFilter === "mine" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              Mine ({myIds.length})
            </button>
          </div>
        )}
      </div>

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
          <AppKitButton />
        </div>
      ) : view === "market" && allIds.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="No active listings"
          description="Be the first to list a gaming asset on the marketplace."
        />
      ) : view === "market" ? (
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
      ) : allIds.length === 0 ? (
        <EmptyState
          icon={<Image size={48} />}
          title="No NFTs minted yet"
          description="Once NFTs are minted, you can browse all or filter to those owned by your wallet."
        />
      ) : ownersLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-500">Loading NFT ownership…</p>
        </div>
      ) : displayNFTIds.length === 0 ? (
        <EmptyState
          icon={<Image size={48} />}
          title="You don't own any NFTs yet"
          description="Switch to 'All' to browse the full collection, or mint some assets."
          action={
            <Button variant="ghost" size="sm" onClick={() => setNFTFilter("all")}>
              Show All NFTs
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayNFTIds.map((id) => {
            const owner = ownerMap.get(id.toString()) ?? "";
            const isOwner = !!address && owner.toLowerCase() === address.toLowerCase();
            return (
              <NFTCard
                key={id.toString()}
                tokenId={id}
                showOwner={!isOwner}
                actionLabel={isOwner ? "Stake" : undefined}
                secondaryActionLabel={isOwner ? "List" : undefined}
                onAction={isOwner ? () => setStakeModal(id) : undefined}
                onSecondaryAction={isOwner ? () => setListModal(id) : undefined}
              />
            );
          })}
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

      <StakeModal
        isOpen={stakeModal !== null}
        onClose={() => setStakeModal(null)}
        tokenId={stakeModal}
        onSuccess={(msg) => success("Staked!", msg)}
        onError={(msg) => error("Error", msg)}
      />

      <ListNFTModal
        isOpen={listModal !== null}
        onClose={() => setListModal(null)}
        tokenId={listModal}
        onSuccess={(msg) => success("Listed!", msg)}
        onError={(msg) => error("Error", msg)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

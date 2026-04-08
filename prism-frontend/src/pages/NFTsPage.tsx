import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { Image, RefreshCw, Filter } from "lucide-react";
import { PageHeader } from "../components/layout/Layout";
import { NFTCard } from "../components/nft/NFTCard";
import { StakeModal } from "../components/staking/StakeModal";
import { ListNFTModal } from "../components/marketplace/MarketplaceModals";
import { EmptyState } from "../components/ui/index";
import { Button } from "../components/ui/Button";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useTotalSupply } from "../hooks/useERC721";
import { useReadContracts } from "wagmi";
import { DIAMOND_ADDRESS, ERC721_ABI } from "../config/contracts";

// ─── Batch fetch ownership for all tokens in one multicall ────────────────────

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

  // Map tokenId → owner address
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

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
      <div className="p-3 pb-0">
        <div className="aspect-square rounded-xl bg-slate-100" />
      </div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-slate-100 rounded-lg" />
          <div className="flex-1 h-10 bg-slate-100 rounded-lg" />
          <div className="flex-1 h-10 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterMode = "all" | "mine";

export function NFTsPage() {
  const { address } = useAccount();
  const { data: totalSupply, isLoading: supplyLoading, refetch: refetchSupply } = useTotalSupply();
  const { toasts, success, error, removeToast } = useToast();

  const [filter, setFilter] = useState<FilterMode>("all");
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<bigint | null>(null);

  const totalCount = totalSupply ? Number(totalSupply) : 0;
  const allIds = useMemo(
    () => Array.from({ length: totalCount }, (_, i) => BigInt(i)),
    [totalCount]
  );

  // Batch fetch all owners in one multicall — much faster than per-card hooks
  const { ownerMap, isLoading: ownersLoading, refetch: refetchOwners } = useAllOwners(allIds);

  const refetchAll = () => { refetchSupply(); refetchOwners(); };

  // Apply filter
  const displayIds = filter === "mine" && address
    ? allIds.filter((id) => {
        const owner = ownerMap.get(id.toString());
        return owner?.toLowerCase() === address.toLowerCase();
      })
    : allIds;

  const isLoading = supplyLoading || (totalCount > 0 && ownersLoading);
  const myCount = address
    ? allIds.filter((id) => ownerMap.get(id.toString())?.toLowerCase() === address.toLowerCase()).length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My NFTs"
        subtitle="Gaming assets on Prism Protocol"
        action={
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetchAll}>
            Refresh
          </Button>
        }
      />

      {/* Filter + stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(["all", "mine"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  filter === f
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                ].join(" ")}
              >
                {f === "all" ? `All (${totalCount})` : `Mine (${myCount})`}
              </button>
            ))}
          </div>
          <Filter size={13} className="text-slate-300" />
        </div>

        <p className="text-xs text-slate-400">
          {totalCount} total minted · HashKey Chain
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        // Skeleton placeholders while data loads — never shows a blank screen
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayIds.length === 0 ? (
        <EmptyState
          icon={<Image size={48} />}
          title={filter === "mine" ? "You don't own any NFTs yet" : "No NFTs minted yet"}
          description={
            filter === "mine"
              ? "Switch to 'All' to browse the full collection, or mint some assets."
              : "The protocol hasn't minted any assets yet."
          }
          action={
            filter === "mine" ? (
              <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
                Show All NFTs
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayIds.map((id) => {
            const owner = ownerMap.get(id.toString()) ?? "";
            const isOwner = !!address && owner.toLowerCase() === address.toLowerCase();
            return (
              <NFTCard
                key={id.toString()}
                tokenId={id}
                showOwner={!isOwner}
                actionLabel={isOwner ? "Stake" : undefined}
                secondaryActionLabel={isOwner ? "List" : undefined}
                onAction={isOwner ? () => { setSelectedToken(id); setStakeModalOpen(true); } : undefined}
                onSecondaryAction={isOwner ? () => { setSelectedToken(id); setListModalOpen(true); } : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      <StakeModal
        isOpen={stakeModalOpen}
        onClose={() => setStakeModalOpen(false)}
        tokenId={selectedToken}
        onSuccess={(msg) => success("Staked!", msg)}
        onError={(msg) => error("Error", msg)}
      />
      <ListNFTModal
        isOpen={listModalOpen}
        onClose={() => setListModalOpen(false)}
        tokenId={selectedToken}
        onSuccess={(msg) => success("Listed!", msg)}
        onError={(msg) => error("Error", msg)}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
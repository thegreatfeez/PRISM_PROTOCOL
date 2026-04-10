import { useMemo, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { Image, Filter } from "lucide-react";
import { PageHeader } from "../components/layout/Layout";
import { EmptyState } from "../components/ui/index";
import { Button } from "../components/ui/Button";
import { NFTCard } from "../components/nft/NFTCard";
import { StakeModal } from "../components/staking/StakeModal";
import { ListNFTModal } from "../components/marketplace/MarketplaceModals";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useTotalSupply } from "../hooks/useERC721";
import { DIAMOND_ADDRESS, ERC721_ABI } from "../config/contracts";

type FilterMode = "all" | "mine";

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

export function NFTInventoryPage() {
  const { address } = useAccount();
  const { data: totalSupply, isLoading: supplyLoading, refetch: refetchSupply } = useTotalSupply();
  const { toasts, success, error, removeToast } = useToast();

  const [filter, setFilter] = useState<FilterMode>("all");
  const [stakeModal, setStakeModal] = useState<bigint | null>(null);
  const [listModal, setListModal] = useState<bigint | null>(null);

  const totalCount = totalSupply ? Number(totalSupply) : 0;
  const allIds = useMemo(() => Array.from({ length: totalCount }, (_, i) => BigInt(i)), [totalCount]);

  const { ownerMap, isLoading: ownersLoading, refetch: refetchOwners } = useAllOwners(allIds);

  const myIds = useMemo(() => {
    if (!address) return [];
    return allIds.filter((id) => ownerMap.get(id.toString())?.toLowerCase() === address.toLowerCase());
  }, [allIds, ownerMap, address]);

  const displayIds = filter === "mine" ? myIds : allIds;
  const isLoading = supplyLoading || (totalCount > 0 && ownersLoading);

  return (
    <div className="space-y-6">
      <PageHeader title="NFT Inventory" subtitle="Signer view: browse all NFTs and list owned ones" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setFilter("all")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === "all" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              All ({allIds.length})
            </button>
            <button
              onClick={() => setFilter("mine")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === "mine" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              Mine ({myIds.length})
            </button>
          </div>
          <Filter size={13} className="text-slate-300" />
        </div>

        <Button variant="ghost" size="sm" onClick={() => { refetchSupply(); refetchOwners(); }}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-500">Loading NFT ownership…</p>
        </div>
      ) : displayIds.length === 0 ? (
        <EmptyState
          icon={<Image size={48} />}
          title={filter === "mine" ? "This wallet owns no NFTs" : "No NFTs minted yet"}
          description={filter === "mine" ? "Switch to 'All' to browse the full collection." : undefined}
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
                onAction={isOwner ? () => setStakeModal(id) : undefined}
                onSecondaryAction={isOwner ? () => setListModal(id) : undefined}
              />
            );
          })}
        </div>
      )}

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


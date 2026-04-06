import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Image, RefreshCw, Plus, Layers, Filter } from "lucide-react";
import { PageHeader } from "../components/layout/Layout";
import { NFTCard } from "../components/nft/NFTCard";
import { StakeModal } from "../components/staking/StakeModal";
import { ListNFTModal } from "../components/marketplace/MarketplaceModals";
import { EmptyState } from "../components/ui/index";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/index";
import { RoleOnly } from "../components/ui/AccessGate";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useTotalSupply, useOwnerOf, useMintNFT } from "../hooks/useERC721";
import { useWriteContract, useWaitForTransactionReceipt, useReadContracts } from "wagmi";
import { DIAMOND_ADDRESS, ERC721_ABI } from "../config/contracts";

// ─── Batch Mint Hook ──────────────────────────────────────────────────────────

function useBatchMint() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const batchMint = (count: bigint) =>
    writeContract({ address: DIAMOND_ADDRESS, abi: ERC721_ABI, functionName: "batchMint", args: [count] });
  return { batchMint, isPending, isConfirming, isSuccess };
}

// ─── Batch fetch ownership for all tokens in one multicall ────────────────────

function useAllOwners(tokenIds: bigint[]) {
  const contracts = tokenIds.map((id) => ({
    address: DIAMOND_ADDRESS as `0x${string}`,
    abi: ERC721_ABI,
    functionName: "ownerOf" as const,
    args: [id] as const,
  }));

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: tokenIds.length > 0 },
  });

  // Map tokenId → owner address
  const ownerMap = new Map<string, string>();
  if (data) {
    data.forEach((result, i) => {
      if (result.status === "success" && result.result) {
        ownerMap.set(tokenIds[i].toString(), result.result as string);
      }
    });
  }

  return { ownerMap, isLoading, refetch };
}

// ─── Batch Mint Modal ─────────────────────────────────────────────────────────

function BatchMintModal({ isOpen, onClose, onSuccess, onError }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [count, setCount] = useState("5");
  const { batchMint, isPending, isConfirming, isSuccess } = useBatchMint();

  useEffect(() => {
    if (isSuccess) { onSuccess(`${count} NFTs minted!`); onClose(); }
  }, [isSuccess]);

  const handleMint = () => {
    const n = parseInt(count);
    if (isNaN(n) || n < 1 || n > 100) { onError("Enter a count between 1 and 100."); return; }
    try { batchMint(BigInt(n)); }
    catch (e: any) { onError(e?.message?.slice(0, 80) || "Batch mint failed"); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Batch Mint NFTs"
      subtitle="Mint multiple gaming assets in a single transaction">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Quick Select</label>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 20, 50].map((p) => (
              <button key={p} onClick={() => setCount(String(p))}
                className={[
                  "py-2.5 rounded-xl border text-sm font-semibold transition-all",
                  count === String(p)
                    ? "border-violet-400 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200",
                ].join(" ")}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <Input label="Custom Count" type="number" min="1" max="100"
          value={count} onChange={(e) => setCount(e.target.value)}
          hint="Max 100 per transaction" suffix="NFTs" />
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-700 space-y-1">
          <p className="font-semibold">What happens</p>
          <p>• {count || "?"} NFTs minted to your wallet in one transaction</p>
          <p>• Traits assigned via Chainlink VRF (may be queued on-chain)</p>
          <p>• On-chain SVG art generated from the VRF seed</p>
        </div>
        <Button fullWidth variant="primary" loading={isPending || isConfirming}
          disabled={!count || isPending || isConfirming} onClick={handleMint}
          icon={<Layers size={14} />}>
          {isPending ? "Confirm in wallet…" : isConfirming ? "Minting…" : `Mint ${count || "?"} NFTs`}
        </Button>
      </div>
    </Modal>
  );
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
  const { mint, isPending: minting, isSuccess: mintedOne } = useMintNFT();
  const { toasts, success, error, removeToast } = useToast();

  const [filter, setFilter] = useState<FilterMode>("all");
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [batchMintOpen, setBatchMintOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<bigint | null>(null);

  useEffect(() => {
    if (mintedOne) { success("Minted!", "Your NFT has been minted."); refetchSupply(); }
  }, [mintedOne]);

  const totalCount = totalSupply ? Number(totalSupply) : 0;
  const allIds = Array.from({ length: totalCount }, (_, i) => BigInt(i + 1));

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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetchAll}>
              Refresh
            </Button>
            <RoleOnly require="signer">
              <Button variant="secondary" size="sm" icon={<Layers size={14} />}
                onClick={() => setBatchMintOpen(true)}>
                Batch Mint
              </Button>
              <Button variant="primary" size="sm" icon={<Plus size={14} />}
                loading={minting}
                onClick={() => { try { mint(); } catch (e: any) { error("Mint failed", e?.message?.slice(0, 60)); } }}>
                Mint One
              </Button>
            </RoleOnly>
          </div>
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
      <BatchMintModal
        isOpen={batchMintOpen}
        onClose={() => setBatchMintOpen(false)}
        onSuccess={(msg) => { success("Minted!", msg); refetchAll(); }}
        onError={(msg) => error("Error", msg)}
      />
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
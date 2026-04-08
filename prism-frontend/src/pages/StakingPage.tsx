import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { TrendingUp, Clock } from "lucide-react";
import { AppKitButton } from "@reown/appkit/react";
import { PageHeader } from "../components/layout/Layout";
import { NFTCard } from "../components/nft/NFTCard";
import { StakeModal } from "../components/staking/StakeModal";
import { StatCard, EmptyState } from "../components/ui/index";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useStakeDurations, useStakeInfo } from "../hooks/useStaking";
import { useTotalSupply } from "../hooks/useERC721";
import { formatDuration, formatDeadline, timeRemaining, isExpired, formatBps } from "../utils/formatters";

// Card for a staked NFT
function StakedNFTCard({
  tokenId,
  userAddress,
  onUnstake,
}: {
  tokenId: bigint;
  userAddress: string;
  onUnstake: (id: bigint) => void;
}) {
  const { data: stakeInfo } = useStakeInfo(tokenId);
  const staker = stakeInfo?.[0] ?? "";
  const expiry = stakeInfo?.[1] ?? 0n;
  const rewardBps = stakeInfo?.[2] ?? 0n;
  const expired = isExpired(expiry);

  const isMyStake = staker.toLowerCase() === userAddress.toLowerCase();
  if (!isMyStake) return null;

  return (
    <div className="flex flex-col gap-0">
      <NFTCard
        tokenId={tokenId}
        actionLabel={expired ? "Unstake" : undefined}
        onAction={expired ? () => onUnstake(tokenId) : undefined}
      />
      {expiry > 0n && (
        <div className={`mt-1 rounded-xl px-3 py-2 text-xs space-y-1 ${expired ? "bg-amber-50 border border-amber-100" : "bg-emerald-50 border border-emerald-100"}`}>
          <div className="flex justify-between">
            <span className="text-slate-500">Expires</span>
            <span className="font-medium text-slate-700">{formatDeadline(expiry)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <span className={`font-medium ${expired ? "text-amber-600" : "text-emerald-600"}`}>
              {expired ? "Can unstake" : timeRemaining(expiry)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Fee share</span>
            <span className="font-medium text-violet-600">{formatBps(rewardBps)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function StakingPage() {
  const { address, isConnected } = useAccount();
  const { data: totalSupply } = useTotalSupply();
  const { data: stakeDurationsData } = useStakeDurations();
  const { toasts, success, error, removeToast } = useToast();

  const [stakeModal, setStakeModal] = useState<bigint | null>(null);

  const durations = stakeDurationsData?.[0] ?? [];
  const rewardBps = stakeDurationsData?.[1] ?? [];

  const allIds = useMemo(
    () =>
      totalSupply
        ? Array.from({ length: Number(totalSupply) }, (_, i) => BigInt(i))
        : [],
    [totalSupply]
  );

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <p className="text-slate-500">Connect your wallet to view staking.</p>
        <AppKitButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staking"
        subtitle="Lock your NFTs to earn 80% of all borrow fees"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Staker Reward Share"
          value="80%"
          sub="of all borrow fees"
          icon={<TrendingUp size={18} />}
          color="emerald"
        />
        <StatCard
          label="Treasury Share"
          value="20%"
          sub="protocol-owned liquidity"
          icon={<TrendingUp size={18} />}
          color="violet"
        />
        <StatCard
          label="Available Durations"
          value={durations.length.toString()}
          sub="staking periods"
          icon={<Clock size={18} />}
          color="sky"
        />
      </div>

      {/* Duration tiers */}
      {durations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Staking Tiers</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {durations.map((d, i) => (
              <div key={i} className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                <p className="text-lg font-bold text-violet-700 font-display">{formatDuration(d)}</p>
                <p className="text-xs text-violet-500 mt-1">
                  {rewardBps[i] ? `${formatBps(rewardBps[i])} fee share` : ""}
                </p>
                <p className="text-xs text-slate-400 mt-1">Lock period</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* How staking works */}
      <Card>
        <CardHeader>
          <CardTitle>How Staking Works</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          {[
            { step: "1", label: "Choose duration", desc: "30, 60, or 90 days" },
            { step: "2", label: "Set borrow price", desc: "PRM tokens per borrow" },
            { step: "3", label: "Earn fees", desc: "80% of every borrow" },
            { step: "4", label: "Unstake", desc: "After expiry, if no borrow" },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-sm font-bold font-display">
                {step}
              </div>
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* My staked NFTs */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          My Staked NFTs
        </h2>
        {allIds.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={48} />}
            title="No NFTs staked"
            description="Go to My NFTs to stake your gaming assets and start earning."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allIds.map((id) => (
              address && (
                <StakedNFTCard
                  key={id.toString()}
                  tokenId={id}
                  userAddress={address}
                  onUnstake={(tid) => setStakeModal(tid)}
                />
              )
            ))}
          </div>
        )}
      </div>

      <StakeModal
        isOpen={stakeModal !== null}
        onClose={() => setStakeModal(null)}
        tokenId={stakeModal}
        onSuccess={(msg) => success("Done!", msg)}
        onError={(msg) => error("Error", msg)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

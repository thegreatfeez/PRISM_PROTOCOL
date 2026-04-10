import { useState, useEffect } from "react";
import { parseUnits } from "viem";
import { useStakeDurations, useStakeNFT } from "../../hooks/useStaking";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/index";

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint | null;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function StakeModal({ isOpen, onClose, tokenId, onSuccess, onError }: StakeModalProps) {
  const { data: stakeDurationsData } = useStakeDurations();
  const { stake, isPending: staking, isSuccess: staked } = useStakeNFT();

  const [selectedDuration, setSelectedDuration] = useState<bigint | null>(null);
  const [borrowPrice, setBorrowPrice] = useState("");

  const durations = stakeDurationsData?.[0] ?? [];
  const rewardBps = stakeDurationsData?.[1] ?? [];

  useEffect(() => {
    if (durations.length > 0) {
      const stillValid = selectedDuration !== null && durations.some((d) => d === selectedDuration);
      if (selectedDuration === null || !stillValid) {
        setSelectedDuration(durations[0]);
      }
    } else {
      setSelectedDuration(null);
    }
  }, [durations, selectedDuration]);

  useEffect(() => {
    if (staked) {
      onSuccess(`NFT #${tokenId} staked successfully!`);
      onClose();
    }
  }, [staked, tokenId, onSuccess, onClose]);

  const handleStake = () => {
    if (!tokenId || !selectedDuration || !borrowPrice) return;
    try {
      const price = parseUnits(borrowPrice, 18);
      stake(tokenId, selectedDuration, price);
    } catch {
      onError("Invalid price — please enter a valid number.");
    }
  };

  const stakeButtonLabel = (() => {
    if (staking) return "Staking…";
    if (durations.length === 0) return "No stake durations set";
    if (selectedDuration === null) return "Select a duration";
    if (!borrowPrice.trim()) return "Enter borrow price";
    return "Stake NFT";
  })();

  const canStake =
    durations.length > 0 && selectedDuration !== null && borrowPrice.trim().length > 0 && !staking;

  if (!tokenId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stake NFT #${tokenId}`}
      subtitle="Lock your NFT to earn a share of borrow fees"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Stake duration</label>
          {durations.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
              No stake durations configured yet. Governance must set tiers first.
            </p>
          ) : (
            <select
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm px-3
                focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
              value={selectedDuration !== null ? selectedDuration.toString() : ""}
              onChange={(e) => setSelectedDuration(BigInt(e.target.value))}
            >
              {durations.map((d, i) => (
                <option key={`${d.toString()}-${i}`} value={d.toString()}>
                  {Number(d) >= 86400
                    ? `${(Number(d) / 86400).toFixed(0)} days`
                    : `${d.toString()} sec`}{" "}
                  · staker fee share {(Number(rewardBps[i] ?? 0n) / 100).toFixed(0)}%
                </option>
              ))}
            </select>
          )}
        </div>

        <Input
          label="Borrow Price (PRM per borrow)"
          placeholder="0.00"
          type="number"
          min="0"
          step="any"
          value={borrowPrice}
          onChange={(e) => setBorrowPrice(e.target.value)}
          suffix="PRM"
          hint="How much borrowers pay in protocol tokens to rent your NFT"
        />

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700 space-y-1">
          <p className="font-semibold">Staking summary</p>
          <p>• Your NFT is held by the contract while staked</p>
          <p>• You choose the borrow fee; duration sets the lock tier</p>
          <p>• Unstake after expiry if the NFT is not actively borrowed</p>
        </div>

        <Button
          fullWidth
          variant="primary"
          loading={staking}
          disabled={!canStake}
          title={!canStake ? stakeButtonLabel : undefined}
          onClick={handleStake}
        >
          {stakeButtonLabel}
        </Button>
      </div>
    </Modal>
  );
}

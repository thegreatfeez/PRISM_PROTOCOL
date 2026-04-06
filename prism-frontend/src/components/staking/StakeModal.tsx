import { useState, useEffect } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/index";
import { useStakeDurations, useStakeNFT } from "../../hooks/useStaking";
import { useIsApprovedForAll, useSetApprovalForAll } from "../../hooks/useERC721";
import { DIAMOND_ADDRESS } from "../../config/contracts";
import { formatDuration } from "../../utils/formatters";

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint | null;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function StakeModal({ isOpen, onClose, tokenId, onSuccess, onError }: StakeModalProps) {
  const { address } = useAccount();
  const { data: stakeDurationsData } = useStakeDurations();
  const { data: isApproved, refetch: refetchApproval } = useIsApprovedForAll(address, DIAMOND_ADDRESS);
  const { setApprovalForAll, isPending: approving, isSuccess: approvalDone } = useSetApprovalForAll();
  const { stake, isPending: staking, isSuccess: staked } = useStakeNFT();

  const [selectedDuration, setSelectedDuration] = useState<bigint | null>(null);
  const [borrowPrice, setBorrowPrice] = useState("");

  const durations = stakeDurationsData?.[0] ?? [];
  const rewardBps = stakeDurationsData?.[1] ?? [];

  useEffect(() => {
    if (durations.length > 0 && selectedDuration === null) {
      setSelectedDuration(durations[0]);
    }
  }, [durations]);

  useEffect(() => {
    if (approvalDone) refetchApproval();
  }, [approvalDone]);

  useEffect(() => {
    if (staked) {
      onSuccess(`NFT #${tokenId} staked successfully!`);
      onClose();
    }
  }, [staked]);

  const handleStake = () => {
    if (!tokenId || !selectedDuration || !borrowPrice) return;
    try {
      const price = parseUnits(borrowPrice, 18);
      stake(tokenId, selectedDuration, price);
    } catch {
      onError("Invalid price — please enter a valid number.");
    }
  };

  const handleApprove = () => {
    setApprovalForAll(DIAMOND_ADDRESS, true);
  };

  if (!tokenId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stake NFT #${tokenId}`}
      subtitle="Lock your NFT to earn 80% of all borrow fees"
    >
      <div className="space-y-4">
        {/* Duration selection */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Stake Duration</label>
          <div className="grid grid-cols-3 gap-2">
            {durations.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDuration(d)}
                className={[
                  "p-3 rounded-xl border text-center transition-all duration-150",
                  selectedDuration === d
                    ? "border-violet-400 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200",
                ].join(" ")}
              >
                <p className="text-sm font-bold">{formatDuration(d)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {rewardBps[i] ? `${(Number(rewardBps[i]) / 100).toFixed(0)}% fee share` : ""}
                </p>
              </button>
            ))}
          </div>
          {durations.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-3">No stake durations configured yet.</p>
          )}
        </div>

        {/* Borrow price */}
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

        {/* Info box */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700 space-y-1">
          <p className="font-semibold">Staking Summary</p>
          <p>• Your NFT enters the borrow market at your price</p>
          <p>• You earn 80% of every borrow fee paid</p>
          <p>• Unstake after expiry (if no active borrow)</p>
        </div>

        {/* Approval + Stake */}
        {!isApproved ? (
          <Button
            fullWidth
            variant="secondary"
            loading={approving}
            onClick={handleApprove}
          >
            Approve NFT Access
          </Button>
        ) : null}

        <Button
          fullWidth
          variant="primary"
          loading={staking}
          disabled={!isApproved || !selectedDuration || !borrowPrice || staking}
          onClick={handleStake}
        >
          {!isApproved ? "Approve First" : "Stake NFT"}
        </Button>
      </div>
    </Modal>
  );
}

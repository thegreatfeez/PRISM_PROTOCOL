import { useMemo } from "react";
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DIAMOND_ADDRESS, STAKING_ABI } from "../config/contracts";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: STAKING_ABI } as const;

const ZERO = "0x0000000000000000000000000000000000000000";

/** Batch `getStakeInfo` for many token IDs (e.g. “mine” includes staked positions). */
export function useStakeInfosBatch(tokenIds: bigint[]) {
  const contracts = useMemo(
    () =>
      tokenIds.map((id) => ({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: STAKING_ABI,
        functionName: "getStakeInfo" as const,
        args: [id] as const,
      })),
    [tokenIds]
  );

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: tokenIds.length > 0 },
  });

  const stakerByTokenId = useMemo(() => {
    const map = new Map<string, `0x${string}`>();
    if (!data) return map;
    data.forEach((result, i) => {
      if (result.status === "success" && result.result) {
        const staker = (result.result as readonly [`0x${string}`, bigint, bigint])[0];
        if (staker && staker.toLowerCase() !== ZERO) {
          map.set(tokenIds[i].toString(), staker);
        }
      }
    });
    return map;
  }, [data, tokenIds]);

  return { stakerByTokenId, isLoading, refetch };
}

export function isStakedTokenId(stakerByTokenId: Map<string, `0x${string}`>, tokenId: bigint): boolean {
  return stakerByTokenId.has(tokenId.toString());
}

export function useStakeDurations() {
  return useReadContract({ ...CONTRACT, functionName: "getStakeDurations" });
}

export function useStakeInfo(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACT,
    functionName: "getStakeInfo",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export function useStakeNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // duration: seconds, price: ERC20 per borrow
  const stake = (tokenId: bigint, duration: bigint, price: bigint) =>
    writeContract({ ...CONTRACT, functionName: "stake", args: [tokenId, duration, price] });

  return { stake, hash, isPending, isConfirming, isSuccess, error };
}

export function useUnstakeNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unstake = (tokenId: bigint) =>
    writeContract({ ...CONTRACT, functionName: "unstake", args: [tokenId] });

  return { unstake, hash, isPending, isConfirming, isSuccess, error };
}

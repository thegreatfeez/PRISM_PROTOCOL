import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DIAMOND_ADDRESS, STAKING_ABI } from "../config/contracts";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: STAKING_ABI } as const;

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

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DIAMOND_ADDRESS, BORROW_ABI } from "../config/contracts";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: BORROW_ABI } as const;

export function useBorrowListing(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACT,
    functionName: "getBorrowListing",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export function useBorrowInfo(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACT,
    functionName: "getBorrowInfo",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export function useRequiredCollateral(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACT,
    functionName: "getRequiredCollateralEth",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export function useBorrowNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const borrow = (tokenId: bigint, duration: bigint, collateral: bigint) =>
    writeContract({
      ...CONTRACT,
      functionName: "borrow",
      args: [tokenId, duration],
      value: collateral,
    });

  return { borrow, hash, isPending, isConfirming, isSuccess, error };
}

export function useReturnNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const returnNFT = (tokenId: bigint) =>
    writeContract({ ...CONTRACT, functionName: "returnNFT", args: [tokenId] });

  return { returnNFT, hash, isPending, isConfirming, isSuccess, error };
}

export function useLiquidate() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const liquidate = (tokenId: bigint) =>
    writeContract({ ...CONTRACT, functionName: "liquidate", args: [tokenId] });

  return { liquidate, hash, isPending, isConfirming, isSuccess, error };
}

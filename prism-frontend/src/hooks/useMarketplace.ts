import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DIAMOND_ADDRESS, MARKETPLACE_ABI } from "../config/contracts";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: MARKETPLACE_ABI } as const;

export function usePlatformFee() {
  return useReadContract({ ...CONTRACT, functionName: "getPlatformFee" });
}

export function useListing(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACT,
    functionName: "getListing",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export function useActiveListings(tokenIds: bigint[]) {
  return useReadContract({
    ...CONTRACT,
    functionName: "getActiveListings",
    args: [tokenIds],
    query: { enabled: tokenIds.length > 0 },
  });
}

export function useListNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const listNFT = (tokenId: bigint, price: bigint) =>
    writeContract({ ...CONTRACT, functionName: "listNFT", args: [tokenId, price] });

  return { listNFT, hash, isPending, isConfirming, isSuccess, error };
}

export function useBuyNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const buyNFT = (tokenId: bigint) =>
    writeContract({ ...CONTRACT, functionName: "buyNFT", args: [tokenId] });

  return { buyNFT, hash, isPending, isConfirming, isSuccess, error };
}

export function useCancelListing() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelListing = (tokenId: bigint) =>
    writeContract({ ...CONTRACT, functionName: "cancelListing", args: [tokenId] });

  return { cancelListing, hash, isPending, isConfirming, isSuccess, error };
}

export function useUpdatePrice() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updatePrice = (tokenId: bigint, newPrice: bigint) =>
    writeContract({ ...CONTRACT, functionName: "updatePrice", args: [tokenId, newPrice] });

  return { updatePrice, hash, isPending, isConfirming, isSuccess, error };
}

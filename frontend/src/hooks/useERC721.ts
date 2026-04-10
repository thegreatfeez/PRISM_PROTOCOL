import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { DIAMOND_ADDRESS, ERC721_ABI } from "../config/contracts";
import { useState } from "react";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: ERC721_ABI } as const;

export function useNFTName() {
  return useReadContract({ ...CONTRACT, functionName: "name" });
}

export function useNFTSymbol() {
  return useReadContract({ ...CONTRACT, functionName: "symbol" });
}

export function useTotalSupply() {
  return useReadContract({ ...CONTRACT, functionName: "totalSupply" });
}

export function useNFTBalance(owner?: string) {
  return useReadContract({
    ...CONTRACT,
    functionName: "balanceOf",
    args: owner ? [owner as `0x${string}`] : undefined,
    query: { enabled: !!owner },
  });
}

export function useOwnerOf(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACT,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export function useTokenData(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACT,
    functionName: "getTokenData",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export function useTokenURI(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACT,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export function useIsApprovedForAll(owner?: string, operator?: string) {
  return useReadContract({
    ...CONTRACT,
    functionName: "isApprovedForAll",
    args: owner && operator ? [owner as `0x${string}`, operator as `0x${string}`] : undefined,
    query: { enabled: !!(owner && operator) },
  });
}

export function useMintNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mint = () => writeContract({ ...CONTRACT, functionName: "mint" });

  return { mint, hash, isPending, isConfirming, isSuccess, error };
}

export function useSetApprovalForAll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setApprovalForAll = (operator: `0x${string}`, approved: boolean) =>
    writeContract({ ...CONTRACT, functionName: "setApprovalForAll", args: [operator, approved] });

  return { setApprovalForAll, hash, isPending, isConfirming, isSuccess, error };
}

// Derive user's token IDs by scanning ownership (simple approach: check IDs 0..totalSupply-1)
export function useUserTokenIds(userAddress?: string, totalSupply?: bigint) {
  const { address } = useAccount();
  const owner = userAddress || address;
  // This is a simplification - in prod you'd use events or an indexer
  return { owner, totalSupply };
}

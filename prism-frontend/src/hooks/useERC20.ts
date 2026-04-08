import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DIAMOND_ADDRESS, ERC20_ABI } from "../config/contracts";
import { maxUint256 } from "viem";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: ERC20_ABI } as const;

export function useTokenName() {
  return useReadContract({ ...CONTRACT, functionName: "name" });
}

export function useTokenSymbol() {
  return useReadContract({ ...CONTRACT, functionName: "symbol" });
}

export function useTokenDecimals() {
  return useReadContract({ ...CONTRACT, functionName: "decimals" });
}

export function useTokenTotalSupply() {
  return useReadContract({ ...CONTRACT, functionName: "erc20TotalSupply" });
}

export function useTokenBalance(account?: string) {
  return useReadContract({
    ...CONTRACT,
    functionName: "erc20BalanceOf",
    args: account ? [account as `0x${string}`] : undefined,
    query: {
      enabled: !!account,
      staleTime: 10_000,
      gcTime: 60_000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });
}

export function useTokenAllowance(owner?: string, spender?: string) {
  return useReadContract({
    ...CONTRACT,
    functionName: "allowance",
    args: owner && spender ? [owner as `0x${string}`, spender as `0x${string}`] : undefined,
    query: { enabled: !!(owner && spender) },
  });
}

export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender: `0x${string}`, amount?: bigint) =>
    writeContract({ ...CONTRACT, functionName: "approve", args: [spender, amount ?? maxUint256] });

  const approveMax = (spender: `0x${string}`) => approve(spender, maxUint256);

  return { approve, approveMax, hash, isPending, isConfirming, isSuccess, error };
}

export function useTransferToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const transfer = (to: `0x${string}`, amount: bigint) =>
    writeContract({ ...CONTRACT, functionName: "transfer", args: [to, amount] });

  return { transfer, hash, isPending, isConfirming, isSuccess, error };
}

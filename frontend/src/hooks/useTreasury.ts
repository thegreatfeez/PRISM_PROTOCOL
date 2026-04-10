import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DIAMOND_ADDRESS, TREASURY_ABI } from "../config/contracts";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: TREASURY_ABI } as const;

export function useWithdrawTreasuryERC20() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = (to: `0x${string}`, amount: bigint) =>
    writeContract({ ...CONTRACT, functionName: "withdrawTreasuryERC20", args: [to, amount] });

  return { withdraw, hash, isPending, isConfirming, isSuccess, error };
}

export function useWithdrawTreasuryETH() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = (to: `0x${string}`, amount: bigint) =>
    writeContract({ ...CONTRACT, functionName: "withdrawTreasuryETH", args: [to, amount] });

  return { withdraw, hash, isPending, isConfirming, isSuccess, error };
}

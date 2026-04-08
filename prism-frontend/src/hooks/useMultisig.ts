import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DIAMOND_ADDRESS, MULTISIG_ABI } from "../config/contracts";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: MULTISIG_ABI } as const;

export function useMultisigOwners() {
  const { isConnected } = useAccount();
  return useReadContract({
    ...CONTRACT,
    functionName: "getOwners",
    query: {
      enabled: isConnected,
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });
}

export function useMultisigRequired() {
  return useReadContract({ ...CONTRACT, functionName: "getRequired" });
}

export function useProposal(proposalId?: bigint) {
  return useReadContract({
    ...CONTRACT,
    functionName: "getProposal",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined },
  });
}

export function useHasApproved(proposalId?: bigint, owner?: string) {
  return useReadContract({
    ...CONTRACT,
    functionName: "hasApproved",
    args: proposalId !== undefined && owner ? [proposalId, owner as `0x${string}`] : undefined,
    query: { enabled: proposalId !== undefined && !!owner },
  });
}

export function usePropose() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const propose = (callData: `0x${string}`) =>
    writeContract({ ...CONTRACT, functionName: "propose", args: [callData] });

  return { propose, hash, isPending, isConfirming, isSuccess, error };
}

export function useApproveProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (proposalId: bigint) =>
    writeContract({ ...CONTRACT, functionName: "approve", args: [proposalId] });

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useRevokeApproval() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const revoke = (proposalId: bigint) =>
    writeContract({ ...CONTRACT, functionName: "revokeApproval", args: [proposalId] });

  return { revoke, hash, isPending, isConfirming, isSuccess, error };
}

export function useExecuteProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const execute = (proposalId: bigint) =>
    writeContract({ ...CONTRACT, functionName: "execute", args: [proposalId] });

  return { execute, hash, isPending, isConfirming, isSuccess, error };
}

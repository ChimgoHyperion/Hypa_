"use client";

import { useAccount, useReadContract } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/app/config/contracts";

export function useIsAdmin() {
  const { address, isConnected } = useAccount();

  const { data: allowed } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "canCreate",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const isAdmin = isConnected && !!address && !!allowed;

  return { isAdmin };
}

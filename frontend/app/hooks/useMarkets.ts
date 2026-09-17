"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI, MARKET_ABI } from "@/app/config/contracts";
import {
  resolveCategory,
  type Category,
} from "@/app/lib/category";

export interface MarketData {
  address: `0x${string}`;
  question: string;
  endTime: bigint;
  resolved: boolean;
  outcome: boolean;
  totalYes: bigint;
  totalNo: bigint;
  creator?: `0x${string}`;
  /** Resolved display category (on-chain when available, else inferred). */
  category: Category;
}

export function useMarkets() {
  const { data: addresses, isLoading: loadingAddresses } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getAllMarkets",
  });

  const marketAddresses = (addresses as `0x${string}`[]) || [];

  const { data: marketInfos, isLoading: loadingInfos } = useReadContracts({
    contracts: marketAddresses.map((addr) => ({
      address: addr,
      abi: MARKET_ABI,
      functionName: "getMarketInfo",
    })),
    query: { enabled: marketAddresses.length > 0 },
  });

  const { data: owners } = useReadContracts({
    contracts: marketAddresses.map((addr) => ({
      address: addr,
      abi: MARKET_ABI,
      functionName: "owner",
    })),
    query: { enabled: marketAddresses.length > 0 },
  });

  // Legacy markets may not expose category(); allowFailure keeps the batch alive.
  const { data: categories } = useReadContracts({
    contracts: marketAddresses.map((addr) => ({
      address: addr,
      abi: MARKET_ABI,
      functionName: "category",
    })),
    allowFailure: true,
    query: { enabled: marketAddresses.length > 0 },
  });

  const markets: MarketData[] = marketAddresses.map((addr, i) => {
    const info = marketInfos?.[i]?.result as
      | [string, bigint, boolean, boolean, bigint, bigint]
      | undefined;
    const question = info?.[0] ?? "Loading...";
    const onChainCategory =
      categories?.[i]?.status === "success"
        ? (categories[i].result as string)
        : null;

    return {
      address: addr,
      question,
      endTime: info?.[1] ?? 0n,
      resolved: info?.[2] ?? false,
      outcome: info?.[3] ?? false,
      totalYes: info?.[4] ?? 0n,
      totalNo: info?.[5] ?? 0n,
      creator: owners?.[i]?.result as `0x${string}` | undefined,
      category: resolveCategory(question, onChainCategory),
    };
  });

  return {
    markets,
    isLoading: loadingAddresses || loadingInfos,
  };
}

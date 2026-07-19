"use client";

import { useEffect, useMemo } from "react";
import {
  useAccount,
  useBalance,
  useBlockNumber,
  usePublicClient,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { parseAbiItem } from "viem";
import { poolsAbi, poolsContractAddress, poolsDeployBlock } from "./config";
import { targetChain } from "./chains";
import { poolRegistry, PoolStatus, type PoolMeta } from "./pools";
import { fundedBps } from "./format";

export interface OnchainPool {
  meta: PoolMeta;
  status: PoolStatus;
  fundingTargetWei: bigint;
  totalContributedWei: bigint;
  minContributionWei: bigint;
  maxPerWalletWei: bigint;
  weiPerUnit: bigint;
  remainingWei: bigint;
  participantCount: number;
  purchasesPaused: boolean;
  treasury: `0x${string}`;
  openingTime: bigint;
  closingTime: bigint;
  bps: number;
  /** Connected wallet's slice (0n when disconnected). */
  userContributedWei: bigint;
  userUnits: bigint;
}

interface PropertyStruct {
  fundingTargetWei: bigint;
  minContributionWei: bigint;
  maxPerWalletWei: bigint;
  weiPerUnit: bigint;
  openingTime: bigint;
  closingTime: bigint;
  treasury: `0x${string}`;
  termsHash: `0x${string}`;
  metadataURI: string;
  totalContributedWei: bigint;
  refundPoolWei: bigint;
  participantCount: bigint;
  status: number;
  purchasesPaused: boolean;
  transfersEnabled: boolean;
  refundsEnabled: boolean;
}

/** Live onchain state for every registered pool (+ user slice when connected). */
export function usePools() {
  const contract = poolsContractAddress();
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    chainId: targetChain.id,
    query: { refetchInterval: 12_000 },
  });

  const base = { address: contract ?? undefined, abi: poolsAbi, chainId: targetChain.id } as const;

  const reads = useReadContracts({
    contracts: poolRegistry.flatMap((p) => [
      { ...base, functionName: "getProperty", args: [p.poolId] },
      ...(address
        ? [
            { ...base, functionName: "contributedWei", args: [p.poolId, address] },
            { ...base, functionName: "balanceOf", args: [address, p.poolId] },
          ]
        : []),
    ]),
    query: { enabled: !!contract },
    blockNumber: undefined,
  });

  // Refetch on new blocks (conservative polling; reads stay source of truth).
  const refetch = reads.refetch;
  useEffect(() => {
    if (blockNumber !== undefined) refetch();
  }, [blockNumber, refetch]);

  const pools = useMemo<OnchainPool[]>(() => {
    if (!contract || !reads.data) return [];
    const stride = address ? 3 : 1;
    return poolRegistry.map((meta, i) => {
      const prop = reads.data[i * stride]?.result as PropertyStruct | undefined;
      const userContrib = address ? ((reads.data[i * stride + 1]?.result as bigint | undefined) ?? 0n) : 0n;
      const userUnits = address ? ((reads.data[i * stride + 2]?.result as bigint | undefined) ?? 0n) : 0n;
      if (!prop) {
        return {
          meta,
          status: PoolStatus.None,
          fundingTargetWei: 0n,
          totalContributedWei: 0n,
          minContributionWei: 0n,
          maxPerWalletWei: 0n,
          weiPerUnit: 1n,
          remainingWei: 0n,
          participantCount: 0,
          purchasesPaused: false,
          treasury: "0x0000000000000000000000000000000000000000",
          openingTime: 0n,
          closingTime: 0n,
          bps: 0,
          userContributedWei: userContrib,
          userUnits,
        };
      }
      const total = BigInt(prop.totalContributedWei);
      const target = BigInt(prop.fundingTargetWei);
      return {
        meta,
        status: prop.status as PoolStatus,
        fundingTargetWei: target,
        totalContributedWei: total,
        minContributionWei: BigInt(prop.minContributionWei),
        maxPerWalletWei: BigInt(prop.maxPerWalletWei),
        weiPerUnit: BigInt(prop.weiPerUnit),
        remainingWei: target - total,
        participantCount: Number(prop.participantCount),
        purchasesPaused: prop.purchasesPaused,
        treasury: prop.treasury,
        openingTime: BigInt(prop.openingTime),
        closingTime: BigInt(prop.closingTime),
        bps: fundedBps(total, target),
        userContributedWei: userContrib,
        userUnits,
      };
    });
  }, [contract, reads.data, address]);

  return {
    pools,
    isLoading: !!contract && reads.isLoading,
    isError: reads.isError,
    refetch: reads.refetch,
    contractConfigured: !!contract,
  };
}

const PURCHASED_EVENT = parseAbiItem(
  "event PropertyPurchased(uint256 indexed propertyId, address indexed purchaser, address indexed treasury, uint256 amountWei, uint256 unitsIssued, uint256 propertyTotalContributedWei, uint256 timestamp)",
);

export interface PurchaseRecord {
  txHash: `0x${string}`;
  logIndex: number;
  blockNumber: bigint;
  propertyId: bigint;
  purchaser: `0x${string}`;
  amountWei: bigint;
  unitsIssued: bigint;
  timestamp: bigint;
}

/**
 * Purchase history from indexed PropertyPurchased events, scanned in bounded
 * block ranges from the recorded deployment block (never from genesis).
 * `purchaser` narrows to one wallet; omit for platform-wide recent activity.
 */
export function usePurchaseHistory(purchaser?: `0x${string}`) {
  const client = usePublicClient({ chainId: targetChain.id });
  const contract = poolsContractAddress();

  return useQuery({
    queryKey: ["purchase-history", targetChain.id, contract, purchaser ?? "all"],
    enabled: !!client && !!contract,
    refetchInterval: 15_000,
    queryFn: async (): Promise<PurchaseRecord[]> => {
      if (!client || !contract) return [];
      const latest = await client.getBlockNumber();
      const from = poolsDeployBlock();
      const CHUNK = 9_000n; // stay under common RPC log-range limits
      const records: PurchaseRecord[] = [];
      for (let start = from; start <= latest; start += CHUNK + 1n) {
        const end = start + CHUNK > latest ? latest : start + CHUNK;
        const logs = await client.getLogs({
          address: contract,
          event: PURCHASED_EVENT,
          args: purchaser ? { purchaser } : undefined,
          fromBlock: start,
          toBlock: end,
        });
        for (const log of logs) {
          records.push({
            txHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: log.blockNumber,
            propertyId: log.args.propertyId!,
            purchaser: log.args.purchaser!,
            amountWei: log.args.amountWei!,
            unitsIssued: log.args.unitsIssued!,
            timestamp: log.args.timestamp!,
          });
        }
      }
      return records.sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : -1));
    },
  });
}

/**
 * Treasury view (spec §19): contract-attributed inflows and the live wallet
 * balance are DISTINCT values — pool progress never derives from the balance.
 */
export function useTreasury() {
  const contract = poolsContractAddress();
  const { pools } = usePools();
  const treasuryAddress = pools.find((p) => p.treasury !== "0x0000000000000000000000000000000000000000")?.treasury;

  const totalForwarded = useReadContract({
    address: contract ?? undefined,
    abi: poolsAbi,
    functionName: "totalForwardedWei",
    chainId: targetChain.id,
    query: { enabled: !!contract, refetchInterval: 12_000 },
  });

  const liveBalance = useBalance({
    address: treasuryAddress,
    chainId: targetChain.id,
    query: { enabled: !!treasuryAddress, refetchInterval: 12_000 },
  });

  return {
    treasuryAddress: treasuryAddress ?? null,
    /** Contract-attributed inflows (authoritative for platform accounting). */
    totalForwardedWei: (totalForwarded.data as bigint | undefined) ?? 0n,
    /** Live wallet balance — can include unrelated funds. */
    liveBalanceWei: liveBalance.data?.value ?? 0n,
    liveBalanceLoaded: !!liveBalance.data,
    pools,
  };
}

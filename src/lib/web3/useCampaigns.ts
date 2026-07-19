"use client";

import { useAccount, useBlockNumber, usePublicClient, useReadContracts } from "wagmi";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAbiItem, type Abi } from "viem";
import { targetChain } from "./chains";
import {
  campaignsAbi,
  campaignsContractAddress,
  campaignRegistry,
  CampaignState,
  type CampaignMeta,
} from "./campaigns";
import { habibiCampaignsDeployments } from "@/lib/contracts/habibiCampaigns";
import { fundedBps } from "./format";

export interface OnchainCampaign {
  meta: CampaignMeta;
  loaded: boolean;
  state: CampaignState;
  fundingTargetWei: bigint;
  minThresholdWei: bigint;
  minContributionWei: bigint;
  maxPerWalletWei: bigint;
  weiPerUnit: bigint;
  totalCommittedWei: bigint;
  totalRefundedWei: bigint;
  releasedAmountWei: bigint;
  finalAcquisitionPriceWei: bigint;
  participantCount: number;
  openingTime: bigint;
  closingTime: bigint;
  feeBps: number;
  transfersEnabled: boolean;
  remainingWei: bigint;
  bps: number;
  escrowWei: bigint;
  /** Connected wallet slice. */
  userContributedWei: bigint;
  userRefundableWei: bigint;
  userUnits: bigint;
  userFinalClaimed: boolean;
}

interface CampaignTuple {
  fundingTarget: bigint;
  minThreshold: bigint;
  minContribution: bigint;
  maxPerWallet: bigint;
  weiPerUnit: bigint;
  openingTime: bigint;
  closingTime: bigint;
  feeBps: number;
  excessPolicy: number;
  feeRecipient: `0x${string}`;
  totalCommitted: bigint;
  totalRefunded: bigint;
  releasedAmount: bigint;
  finalAcquisitionPrice: bigint;
  participantCount: bigint;
  state: number;
  transfersEnabled: boolean;
  acquisitionDestination: `0x${string}`;
}

export function useCampaign(meta: CampaignMeta | undefined) {
  const contract = campaignsContractAddress();
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true, chainId: targetChain.id, query: { refetchInterval: 12_000 } });

  const id = meta?.campaignId;

  type Call = {
    address: `0x${string}` | undefined;
    abi: Abi;
    chainId: number;
    functionName: string;
    args: readonly unknown[];
  };
  const calls: Call[] = [];
  if (contract && id !== undefined) {
    const base = { address: contract, abi: campaignsAbi, chainId: targetChain.id } as const;
    calls.push({ ...base, functionName: "getCampaign", args: [id] });
    if (address) {
      calls.push({ ...base, functionName: "contributedWei", args: [id, address] });
      calls.push({ ...base, functionName: "refundableAmount", args: [id, address] });
      calls.push({ ...base, functionName: "balanceOf", args: [address, id] });
      calls.push({ ...base, functionName: "finalClaimed", args: [id, address] });
    }
  }

  const reads = useReadContracts({
    contracts: calls,
    query: { enabled: !!contract && id !== undefined },
  });

  useEffect(() => {
    if (blockNumber !== undefined) reads.refetch();
  }, [blockNumber, reads]);

  const configured = !!contract;
  let campaign: OnchainCampaign | null = null;
  if (meta && reads.data) {
    const c = reads.data[0]?.result as CampaignTuple | undefined;
    if (c) {
      const total = c.totalCommitted;
      const target = c.fundingTarget;
      campaign = {
        meta,
        loaded: true,
        state: c.state as CampaignState,
        fundingTargetWei: target,
        minThresholdWei: c.minThreshold,
        minContributionWei: c.minContribution,
        maxPerWalletWei: c.maxPerWallet,
        weiPerUnit: c.weiPerUnit,
        totalCommittedWei: total,
        totalRefundedWei: c.totalRefunded,
        releasedAmountWei: c.releasedAmount,
        finalAcquisitionPriceWei: c.finalAcquisitionPrice,
        participantCount: Number(c.participantCount),
        openingTime: c.openingTime,
        closingTime: c.closingTime,
        feeBps: Number(c.feeBps),
        transfersEnabled: c.transfersEnabled,
        remainingWei: target - total,
        bps: fundedBps(total, target),
        escrowWei: total - c.releasedAmount - c.totalRefunded,
        userContributedWei: address ? ((reads.data[1]?.result as bigint | undefined) ?? 0n) : 0n,
        userRefundableWei: address ? ((reads.data[2]?.result as bigint | undefined) ?? 0n) : 0n,
        userUnits: address ? ((reads.data[3]?.result as bigint | undefined) ?? 0n) : 0n,
        userFinalClaimed: address ? ((reads.data[4]?.result as boolean | undefined) ?? false) : false,
      };
    }
  }

  return { campaign, configured, isLoading: reads.isLoading, isError: reads.isError, refetch: reads.refetch };
}

/* -------------------------------------------------------------------- */
/*  All-campaign positions for the portfolio (live contract reads)      */
/* -------------------------------------------------------------------- */

/** Reads every registered campaign + the connected wallet's slice. */
export function useUserCampaigns() {
  const contract = campaignsContractAddress();
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true, chainId: targetChain.id, query: { refetchInterval: 12_000 } });

  type Call = { address: `0x${string}`; abi: Abi; chainId: number; functionName: string; args: readonly unknown[] };
  const calls: Call[] = [];
  if (contract) {
    for (const meta of campaignRegistry) {
      const base = { address: contract, abi: campaignsAbi, chainId: targetChain.id } as const;
      calls.push({ ...base, functionName: "getCampaign", args: [meta.campaignId] });
      if (address) {
        calls.push({ ...base, functionName: "contributedWei", args: [meta.campaignId, address] });
        calls.push({ ...base, functionName: "refundableAmount", args: [meta.campaignId, address] });
        calls.push({ ...base, functionName: "balanceOf", args: [address, meta.campaignId] });
        calls.push({ ...base, functionName: "finalClaimed", args: [meta.campaignId, address] });
      }
    }
  }

  const reads = useReadContracts({ contracts: calls, query: { enabled: !!contract } });
  useEffect(() => {
    if (blockNumber !== undefined) reads.refetch();
  }, [blockNumber, reads]);

  const data = reads.data as ReadonlyArray<{ result?: unknown }> | undefined;
  const stride = address ? 5 : 1;
  const positions: OnchainCampaign[] = [];
  if (contract && data) {
    campaignRegistry.forEach((meta, i) => {
      const c = data[i * stride]?.result as CampaignTuple | undefined;
      if (!c) return;
      const userContributed = address ? ((data[i * stride + 1]?.result as bigint | undefined) ?? 0n) : 0n;
      const total = c.totalCommitted;
      const target = c.fundingTarget;
      positions.push({
        meta,
        loaded: true,
        state: c.state as CampaignState,
        fundingTargetWei: target,
        minThresholdWei: c.minThreshold,
        minContributionWei: c.minContribution,
        maxPerWalletWei: c.maxPerWallet,
        weiPerUnit: c.weiPerUnit,
        totalCommittedWei: total,
        totalRefundedWei: c.totalRefunded,
        releasedAmountWei: c.releasedAmount,
        finalAcquisitionPriceWei: c.finalAcquisitionPrice,
        participantCount: Number(c.participantCount),
        openingTime: c.openingTime,
        closingTime: c.closingTime,
        feeBps: Number(c.feeBps),
        transfersEnabled: c.transfersEnabled,
        remainingWei: target - total,
        bps: fundedBps(total, target),
        escrowWei: total - c.releasedAmount - c.totalRefunded,
        userContributedWei: userContributed,
        userRefundableWei: address ? ((data[i * stride + 2]?.result as bigint | undefined) ?? 0n) : 0n,
        userUnits: address ? ((data[i * stride + 3]?.result as bigint | undefined) ?? 0n) : 0n,
        userFinalClaimed: address ? ((data[i * stride + 4]?.result as boolean | undefined) ?? false) : false,
      });
    });
  }

  return {
    positions,
    configured: !!contract,
    isLoading: !!contract && reads.isLoading,
    isError: reads.isError,
    refetch: reads.refetch,
  };
}

/* -------------------------------------------------------------------- */
/*  Onchain contribution history (indexed events)                       */
/* -------------------------------------------------------------------- */

const CONTRIBUTION_EVENT = parseAbiItem(
  "event ContributionReceived(uint256 indexed campaignId, address indexed contributor, uint256 amountWei, uint256 proposedUnits, uint256 totalCommittedWei, uint256 timestamp)",
);

export interface ContributionRecord {
  txHash: `0x${string}`;
  logIndex: number;
  blockNumber: bigint;
  campaignId: bigint;
  contributor: `0x${string}`;
  amountWei: bigint;
  proposedUnits: bigint;
  timestamp: bigint;
}

/** Contribution history from indexed events, scanned in bounded ranges from the
 *  recorded deploy block (never from genesis). */
export function useContributionHistory(opts?: { campaignId?: bigint; contributor?: `0x${string}` }) {
  const client = usePublicClient({ chainId: targetChain.id });
  const contract = campaignsContractAddress();
  const deployBlock = BigInt(habibiCampaignsDeployments[targetChain.id]?.deployBlock ?? 0);

  return useQuery({
    queryKey: ["contribution-history", targetChain.id, contract, opts?.campaignId?.toString() ?? "all", opts?.contributor ?? "all"],
    enabled: !!client && !!contract,
    refetchInterval: 15_000,
    queryFn: async (): Promise<ContributionRecord[]> => {
      if (!client || !contract) return [];
      const latest = await client.getBlockNumber();
      const CHUNK = 9_000n;
      const out: ContributionRecord[] = [];
      for (let start = deployBlock; start <= latest; start += CHUNK + 1n) {
        const end = start + CHUNK > latest ? latest : start + CHUNK;
        const logs = await client.getLogs({
          address: contract,
          event: CONTRIBUTION_EVENT,
          args: {
            ...(opts?.campaignId !== undefined ? { campaignId: opts.campaignId } : {}),
            ...(opts?.contributor ? { contributor: opts.contributor } : {}),
          },
          fromBlock: start,
          toBlock: end,
        });
        for (const log of logs) {
          out.push({
            txHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: log.blockNumber,
            campaignId: log.args.campaignId!,
            contributor: log.args.contributor!,
            amountWei: log.args.amountWei!,
            proposedUnits: log.args.proposedUnits!,
            timestamp: log.args.timestamp!,
          });
        }
      }
      return out.sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : -1));
    },
  });
}

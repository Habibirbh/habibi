"use client";

import { useAccount, useBlockNumber, useReadContracts } from "wagmi";
import { useEffect } from "react";
import { targetChain } from "./chains";
import { campaignsAbi, campaignsContractAddress, CampaignState, type CampaignMeta } from "./campaigns";
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
    abi: typeof campaignsAbi;
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

"use client";

import { use, useCallback } from "react";
import Link from "next/link";
import { formatEther, isAddress } from "viem";
import { useReadContract } from "wagmi";
import { refreshMarketHistory } from "@/app/hooks/useAllHistory";
import { BetPanel } from "./BetPanel";
import { ResolvePanel } from "./ResolvePanel";
import { OddsChart } from "./OddsChart";
import { SiteHeader } from "@/app/components/SiteHeader";
import { MarketThumb } from "@/app/components/MarketThumb";
import { CopyAddress } from "@/app/components/CopyAddress";
import { Ticker } from "@/app/components/Ticker";
import { useMarkets } from "@/app/hooks/useMarkets";
import { MARKET_ABI } from "@/app/config/contracts";
import {
  formatCompactVolume,
  formatTimeLeft,
  getVolume,
  getYesPercent,
  shortAddress,
} from "@/app/lib/odds";
import { resolveCategory, CATEGORY_STYLES } from "@/app/lib/category";

function formatCloseTime(endTime: bigint) {
  if (endTime === 0n) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(Number(endTime) * 1000));
}

export default function MarketPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const validAddress = isAddress(address);
  const marketAddress = address as `0x${string}`;
  const { markets } = useMarkets();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: "getMarketInfo",
    query: { enabled: validAddress },
  });
  const { data: owner } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: "owner",
    query: { enabled: validAddress },
  });
  const { data: onChainCategory } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: "category",
    query: { enabled: validAddress },
  });

  const info = data as
    | [string, bigint, boolean, boolean, bigint, bigint]
    | undefined;
  const question = info?.[0] ?? "";
  const endTime = info?.[1] ?? 0n;
  const resolved = info?.[2] ?? false;
  const outcome = info?.[3] ?? false;
  const totalYes = info?.[4] ?? 0n;
  const totalNo = info?.[5] ?? 0n;
  const yesPercent = getYesPercent(totalYes, totalNo);
  const noPercent = 100 - yesPercent;
  const volume = getVolume(totalYes, totalNo);
  const category = resolveCategory(
    question,
    typeof onChainCategory === "string" ? onChainCategory : null
  );

  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const ended = endTime > 0n && endTime <= nowSec;
  const status = resolved ? "Resolved" : ended ? "Awaiting resolution" : "Live";

  const handleUpdate = useCallback(() => {
    refetch();
  }, [refetch]);
  const handleBetPlaced = useCallback(() => {
    refetch();
    refreshMarketHistory().catch(() => {
      // The confirmed trade still succeeds if the optional chart refresh fails.
    });
  }, [refetch]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Ticker markets={markets} />
      <SiteHeader
        breadcrumb={
          <div className="text-xs text-muted truncate">
            <Link
              href="/"
              className="hover:text-foreground transition-colors rounded focus-ring"
            >
              Markets
            </Link>
            <span className="mx-2 text-border-strong">/</span>
            <span className="text-dim">{question ? category : "Market"}</span>
          </div>
        }
      />

      {!validAddress || isError ? (
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl grid place-items-center bg-no-bg text-no">
            !
          </div>
          <h1 className="text-xl font-medium mb-2">Market unavailable</h1>
          <p className="text-sm text-muted mb-6">
            This address is invalid or the market could not be read from
            Avalanche Fuji.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium focus-ring"
          >
            Browse markets
          </Link>
        </div>
      ) : isLoading ? (
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="h-5 w-40 rounded bg-white/5 mb-5" />
          <div className="h-20 max-w-2xl rounded-xl bg-white/5 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
            <div className="h-80 rounded-xl animate-shimmer" />
            <div className="h-96 rounded-xl animate-shimmer" />
          </div>
        </div>
      ) : (
        <>
          {/* Market identity and primary outcome prices */}
          <section className="relative border-b border-border-subtle overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-28 left-1/4 w-96 h-64 rounded-full bg-yes/5 blur-3xl pointer-events-none"
            />
            <div className="relative max-w-6xl mx-auto px-6 py-7 sm:py-9">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded border ${CATEGORY_STYLES[category]}`}
                >
                  {category}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 font-mono-nums text-[10px] px-2 py-0.5 rounded-full ${
                    resolved
                      ? outcome
                        ? "text-yes bg-yes-bg"
                        : "text-no bg-no-bg"
                      : ended
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-yes bg-yes-bg"
                  }`}
                >
                  {!resolved && !ended && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-yes opacity-75 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yes" />
                    </span>
                  )}
                  {status.toUpperCase()}
                </span>
                {!resolved && (
                  <span className="font-mono-nums text-[10px] text-muted">
                    {formatTimeLeft(endTime, nowSec)}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4 max-w-3xl mb-7">
                <MarketThumb
                  address={marketAddress}
                  question={question}
                  category={category}
                  size={60}
                  rounded="rounded-xl"
                />
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold leading-snug">
                    {question}
                  </h1>
                  <p className="text-xs text-muted mt-2">
                    Binary prediction market settled on Avalanche Fuji
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl">
                <div className="rounded-xl border border-yes/25 bg-yes-bg p-3.5">
                  <div className="text-[10px] font-semibold text-yes mb-2">
                    YES
                  </div>
                  <div className="font-mono-nums text-2xl font-semibold text-yes">
                    {yesPercent}¢
                  </div>
                  <div className="text-[10px] text-muted mt-1">
                    {yesPercent}% probability
                  </div>
                </div>
                <div className="rounded-xl border border-no/25 bg-no-bg p-3.5">
                  <div className="text-[10px] font-semibold text-no mb-2">
                    NO
                  </div>
                  <div className="font-mono-nums text-2xl font-semibold text-no">
                    {noPercent}¢
                  </div>
                  <div className="text-[10px] text-muted mt-1">
                    {noPercent}% probability
                  </div>
                </div>
                <div className="rounded-xl border border-border-subtle bg-surface p-3.5">
                  <div className="text-[10px] text-muted mb-2">VOLUME</div>
                  <div className="font-mono-nums text-lg text-foreground">
                    {formatCompactVolume(volume)}
                  </div>
                  <div className="text-[10px] text-muted mt-1">AVAX traded</div>
                </div>
                <div className="rounded-xl border border-border-subtle bg-surface p-3.5">
                  <div className="text-[10px] text-muted mb-2">LIQUIDITY</div>
                  <div className="font-mono-nums text-lg text-foreground">
                    {formatCompactVolume(volume)}
                  </div>
                  <div className="text-[10px] text-muted mt-1">AVAX in pools</div>
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
            <div className="order-2 lg:order-1 min-w-0 space-y-5">
              <OddsChart
                marketAddress={marketAddress}
                currentYesPercent={yesPercent}
              />

              <section className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
                <div className="p-5 border-b border-border-subtle">
                  <h2 className="text-sm font-medium">Market information</h2>
                  <p className="text-[11px] text-muted mt-1">
                    Timing, pools and settlement details
                  </p>
                </div>
                <dl className="grid sm:grid-cols-2">
                  <Detail label="Status" value={status} />
                  <Detail label="Closes" value={formatCloseTime(endTime)} />
                  <Detail
                    label="YES pool"
                    value={`${Number(formatEther(totalYes)).toFixed(3)} AVAX`}
                  />
                  <Detail
                    label="NO pool"
                    value={`${Number(formatEther(totalNo)).toFixed(3)} AVAX`}
                  />
                  <Detail
                    label="Resolver"
                    value={shortAddress(owner as string | undefined)}
                  />
                  <Detail
                    label="Final outcome"
                    value={resolved ? (outcome ? "YES" : "NO") : "Pending"}
                  />
                </dl>
              </section>

              <section className="rounded-xl border border-border-subtle bg-surface p-5">
                <h2 className="text-sm font-medium mb-1">How settlement works</h2>
                <p className="text-[11px] text-muted mb-5">
                  Transparent rules enforced by this market’s smart contract
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <InfoStep
                    number="01"
                    title="Trading closes"
                    text={`Orders stop at ${formatCloseTime(endTime)}.`}
                  />
                  <InfoStep
                    number="02"
                    title="Owner resolves"
                    text="The market owner submits the final YES or NO result on-chain."
                  />
                  <InfoStep
                    number="03"
                    title="Winners claim"
                    text="Winning stakes share the losing pool after the 2% platform fee."
                  />
                </div>
              </section>

              <section className="rounded-xl border border-border-subtle bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-mono-nums text-[10px] text-muted mb-1">
                      SMART CONTRACT · AVALANCHE FUJI
                    </div>
                    <CopyAddress address={marketAddress} />
                  </div>
                  <a
                    href={`https://testnet.snowtrace.io/address/${marketAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-2 rounded-lg border border-border-strong text-dim hover:text-foreground hover:border-muted transition-colors focus-ring"
                  >
                    View on Snowtrace ↗
                  </a>
                </div>
              </section>
            </div>

            <aside className="order-1 lg:order-2 lg:sticky lg:top-20">
              <BetPanel
                marketAddress={marketAddress}
                yesPercent={yesPercent}
                resolved={resolved}
                ended={ended}
                totalYes={totalYes}
                totalNo={totalNo}
                onBetPlaced={handleBetPlaced}
              />
              <ResolvePanel
                marketAddress={marketAddress}
                endTime={endTime}
                resolved={resolved}
                outcome={outcome}
                onUpdate={handleUpdate}
              />
            </aside>
          </div>
        </>
      )}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 border-b border-border-subtle sm:odd:border-r">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono-nums text-[11px] text-dim text-right">{value}</dd>
    </div>
  );
}

function InfoStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg bg-background/60 border border-border-subtle p-3.5">
      <div className="font-mono-nums text-[9px] text-avax mb-2">{number}</div>
      <div className="text-xs font-medium mb-1.5">{title}</div>
      <p className="text-[11px] leading-relaxed text-muted">{text}</p>
    </div>
  );
}

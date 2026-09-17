"use client";

import Link from "next/link";
import { Sparkline } from "./Sparkline";
import { MarketThumb } from "./MarketThumb";

import type { MarketData } from "@/app/hooks/useMarkets";
import {
  getYesPercent,
  getVolume,
  formatEndTime,
  formatTimeLeft,
  formatCompactVolume,
  shortAddress,
} from "@/app/lib/odds";
import { CATEGORY_STYLES } from "@/app/lib/category";

export function MarketCard({ market }: { market: MarketData }) {
  const yesPercent = getYesPercent(market.totalYes, market.totalNo);
  const noPercent = 100 - yesPercent;
  const volume = getVolume(market.totalYes, market.totalNo);

  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const ended = market.endTime <= nowSec;
  const category = market.category;

  const closingSoon =
    !ended && !market.resolved && market.endTime - nowSec < 86400n;

  return (
    <div
      className={`
        group relative bg-surface border border-border-subtle rounded-xl
        h-full flex flex-col overflow-hidden
        transition-all duration-200
        hover:border-border-strong hover:bg-surface-hover
        hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/50
        ${market.resolved ? "opacity-70 hover:opacity-100" : ""}
      `}
    >
      {/* Probability bar pinned to the top edge, so the odds read at a glance */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-no/30">
        <div
          className="h-full bg-yes transition-all duration-500"
          style={{ width: `${yesPercent}%` }}
        />
      </div>

      <div className="p-4 pt-4.5 flex flex-col h-full">
        {/* ─── Meta row: topic, status, deadline ─── */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded border ${CATEGORY_STYLES[category]}`}
          >
            {category}
          </span>

          {market.resolved ? (
            <span className="font-mono-nums text-[9px] uppercase tracking-wide text-muted">
              Settled
            </span>
          ) : closingSoon ? (
            <span className="flex items-center gap-1 font-mono-nums text-[9px] uppercase tracking-wide text-avax">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-avax opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-avax" />
              </span>
              Closing soon
            </span>
          ) : null}

          <span className="ml-auto font-mono-nums text-[9px] text-muted whitespace-nowrap">
            {market.resolved
              ? formatEndTime(market.endTime)
              : formatTimeLeft(market.endTime, nowSec)}
          </span>
        </div>

        {/* ─── Thumbnail + question ─── */}
        <Link
          href={`/market/${market.address}`}
          className="flex gap-3 items-start mb-3.5 rounded-lg focus-ring"
        >
          <div className="transition-transform duration-200 group-hover:scale-105">
            <MarketThumb
              address={market.address}
              question={market.question}
              category={category}
            />
          </div>
          <div className="text-[13px] font-medium leading-snug text-foreground/90 min-h-9 line-clamp-3 group-hover:text-white transition-colors">
            {market.question}
          </div>
        </Link>

        {/* ─── Odds + trend ─── */}
        <div className="flex items-end justify-between gap-3 mb-3">
          <div className="leading-none">
            <div className="font-mono-nums text-2xl font-semibold text-yes tracking-tight">
              {yesPercent}%
            </div>
            <div className="text-[9px] text-muted mt-1.5 uppercase tracking-wide">
              chance yes
            </div>
          </div>
          <div className="flex-1 max-w-28 opacity-70 group-hover:opacity-100 transition-opacity">
            <Sparkline
              marketAddress={market.address}
              currentYesPercent={yesPercent}
            />
          </div>
        </div>

        {/* ─── Yes / No ─── */}
        {market.resolved ? (
          <div
            className={`font-mono-nums text-center py-2 text-[11px] rounded-lg border ${
              market.outcome
                ? "bg-yes-bg border-yes/25 text-yes"
                : "bg-no-bg border-no/25 text-no"
            }`}
          >
            {market.outcome ? "YES WON" : "NO WON"}
          </div>
        ) : ended ? (
          <div className="font-mono-nums text-center py-2 text-[10px] uppercase tracking-wide rounded-lg border border-border-strong text-muted">
            Awaiting resolution
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href={`/market/${market.address}?side=yes`}
              aria-label={`Buy yes at ${yesPercent} cents`}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-yes-bg border border-yes/25 text-yes text-[11px] font-semibold hover:bg-yes hover:border-yes hover:text-white active:scale-[0.98] transition-all focus-ring"
            >
              Yes <span className="font-mono-nums">{yesPercent}¢</span>
            </Link>
            <Link
              href={`/market/${market.address}?side=no`}
              aria-label={`Buy no at ${noPercent} cents`}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-no-bg border border-no/25 text-no text-[11px] font-semibold hover:bg-no hover:border-no hover:text-white active:scale-[0.98] transition-all focus-ring"
            >
              No <span className="font-mono-nums">{noPercent}¢</span>
            </Link>
          </div>
        )}

        {/* ─── Footer: volume + creator ─── */}
        <div className="mt-auto pt-3 flex items-center justify-between font-mono-nums text-[9px] text-muted">
          <span>{formatCompactVolume(volume)} AVAX VOL.</span>
          <span
            className="truncate max-w-28 hover:text-dim transition-colors"
            title={market.creator}
          >
            {shortAddress(market.creator)}
          </span>
        </div>
      </div>
    </div>
  );
}

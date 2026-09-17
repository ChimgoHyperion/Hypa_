"use client";

import Link from "next/link";
import { useMarketHistory } from "@/app/hooks/useAllHistory";
import type { MarketData } from "@/app/hooks/useMarkets";
import {
  getYesPercent,
  getVolume,
  formatTimeLeft,
  formatCompactVolume,
} from "@/app/lib/odds";
import { CATEGORY_STYLES } from "@/app/lib/category";
import { MarketThumb } from "./MarketThumb";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function FeaturedMarket({ market }: { market: MarketData }) {
  const yesPercent = getYesPercent(market.totalYes, market.totalNo);
  const noPercent = 100 - yesPercent;
  const volume = getVolume(market.totalYes, market.totalNo);
  const category = market.category;

  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));

  const { points, isSyncing } = useMarketHistory(market.address);

  const data = points.map((p, i) => ({
    time: `#${i + 1}`,
    yes: p.yes,
    no: 100 - p.yes,
  }));
  data.push({ time: "Now", yes: yesPercent, no: noPercent });

  const startPercent = points.length > 0 ? points[0].yes : 50;
  const change = yesPercent - startPercent;

  return (
    <section className="relative border-b border-border-subtle overflow-hidden">
      {/* Soft accent wash so the hero separates from the grid below */}
      <div
        aria-hidden
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-avax/10 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-6xl mx-auto px-6 py-9">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center gap-1.5 font-mono-nums text-[10px] tracking-widest text-avax">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-avax opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-avax" />
            </span>
            FEATURED
          </span>
          <span className="h-px flex-1 bg-border-subtle" />
          <span className="font-mono-nums text-[10px] text-muted">
            HIGHEST VOLUME
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-10 items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded border ${CATEGORY_STYLES[category]}`}
              >
                {category}
              </span>
              <span className="font-mono-nums text-[10px] text-muted">
                {formatTimeLeft(market.endTime, nowSec)}
              </span>
            </div>

            <Link
              href={`/market/${market.address}`}
              className="flex items-start gap-4 mb-6 rounded-lg focus-ring group"
            >
              <MarketThumb
                address={market.address}
                question={market.question}
                category={category}
                size={56}
                rounded="rounded-xl"
              />
              <h2 className="text-xl sm:text-2xl font-medium leading-snug group-hover:text-white transition-colors">
                {market.question}
              </h2>
            </Link>

            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="font-mono-nums text-5xl sm:text-6xl font-semibold text-yes leading-none tracking-tight">
                {yesPercent}
              </span>
              <span className="font-mono-nums text-2xl text-yes">%</span>
              {points.length > 0 && change !== 0 && (
                <span
                  className={`font-mono-nums text-xs ml-2 px-1.5 py-0.5 rounded ${
                    change > 0
                      ? "text-yes bg-yes-bg"
                      : "text-no bg-no-bg"
                  }`}
                >
                  {change > 0 ? "▲" : "▼"} {Math.abs(change)}
                </span>
              )}
            </div>

            <div className="text-xs text-muted mb-6">
              chance yes ·{" "}
              <span className="font-mono-nums text-dim">
                {formatCompactVolume(volume)} AVAX
              </span>{" "}
              volume
            </div>

            <div className="grid grid-cols-2 gap-2 max-w-sm">
              <Link
                href={`/market/${market.address}?side=yes`}
                className="text-center py-3 text-xs font-semibold rounded-lg bg-yes-bg border border-yes/30 text-yes hover:bg-yes hover:border-yes hover:text-white active:scale-[0.98] transition-all focus-ring"
              >
                Buy yes · {yesPercent}¢
              </Link>
              <Link
                href={`/market/${market.address}?side=no`}
                className="text-center py-3 text-xs font-semibold rounded-lg bg-no-bg border border-no/25 text-no hover:bg-no hover:border-no hover:text-white active:scale-[0.98] transition-all focus-ring"
              >
                Buy no · {noPercent}¢
              </Link>
            </div>
          </div>

          <div className="h-52 rounded-xl border border-border-subtle bg-surface/40 p-3">
            {data.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="yesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#3a3a3a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#3a3a3a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v + "%"}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#141414",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#888" }}
                  />
                  <Area
                    type="stepAfter"
                    dataKey="yes"
                    name="Yes"
                    stroke="#1D9E75"
                    strokeWidth={2}
                    fill="url(#yesFill)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-1.5 text-center px-4">
                <span className="font-mono-nums text-2xl text-yes">
                  {yesPercent}%
                </span>
                <span className="text-[11px] text-muted">
                  {isSyncing
                    ? "Fetching earlier trades…"
                    : "Live implied probability"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

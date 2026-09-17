"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import { Ticker } from "@/app/components/Ticker";
import { FeaturedMarket } from "@/app/components/FeaturedMarket";
import { MarketCardSkeleton } from "@/app/components/MarketCardSkeleton";
import { useMarkets } from "@/app/hooks/useMarkets";
import { CATEGORIES } from "@/app/lib/category";
import { MarketCard } from "./components/MarketCard";

function MarketsSkeleton() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-9 border-b border-border-subtle">
        <div className="h-3 w-24 rounded bg-white/5 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10">
          <div className="space-y-4">
            <div className="h-4 w-20 rounded bg-white/5" />
            <div className="h-6 w-full rounded bg-white/5" />
            <div className="h-14 w-32 rounded bg-white/5" />
            <div className="h-11 w-full max-w-sm rounded-lg bg-white/5" />
          </div>
          <div className="h-52 rounded-xl bg-white/5" />
        </div>
      </div>
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </>
  );
}

function HomeContent() {
  const { markets, isLoading } = useMarkets();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Driven by the URL so footer category links and shared links both work
  const filter = searchParams.get("category") ?? "All";

  const setFilter = useCallback(
    (next: string) => {
      router.replace(next === "All" ? "/" : `/?category=${encodeURIComponent(next)}`, {
        scroll: false,
      });
    },
    [router]
  );

  // Pick the featured market: highest volume, not resolved
  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const liveMarkets = markets.filter((m) => !m.resolved && m.endTime > nowSec);
  const featured =
    liveMarkets.length > 0
      ? liveMarkets.reduce((best, m) =>
          m.totalYes + m.totalNo > best.totalYes + best.totalNo ? m : best
        )
      : markets[0];

  // The rest go in the grid (exclude the featured one)
  const rest = markets.filter((m) => m.address !== featured?.address);
  const open = rest.filter((m) => !m.resolved);
  const resolved = rest.filter((m) => m.resolved);

  // Counts come from what is actually in the grid, so the numbers never lie
  const counts: Record<string, number> = {
    All: open.length,
    Resolved: resolved.length,
  };
  for (const c of CATEGORIES) {
    counts[c] = open.filter((m) => m.category === c).length;
  }

  const visibleFilters = [
    "All",
    ...CATEGORIES.filter((c) => counts[c] > 0),
    ...(counts.Resolved > 0 ? ["Resolved"] : []),
  ];

  const filtered =
    filter === "Resolved"
      ? resolved
      : filter === "All"
      ? open
      : open.filter((m) => m.category === filter);

  if (isLoading) return <MarketsSkeleton />;

  if (markets.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="text-xl mb-2">No markets yet</div>
        <p className="text-sm text-muted mb-6">
          Be the first to ask a question.
        </p>
        <Link
          href="/create"
          className="inline-block text-sm px-5 py-2.5 rounded-lg bg-avax hover:bg-avax-hover transition-colors font-medium focus-ring"
        >
          Create a market
        </Link>
      </div>
    );
  }

  return (
    <>
      {featured && <FeaturedMarket market={featured} />}

      {/* ─── Filters ─── */}
      <div className="sticky top-14 z-20 bg-background/85 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {visibleFilters.map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors focus-ring ${
                    isActive
                      ? "bg-foreground text-background border-foreground font-medium"
                      : "border-border-strong text-dim hover:text-foreground hover:border-muted"
                  }`}
                >
                  {f}
                  <span
                    className={`font-mono-nums text-[10px] ${
                      isActive ? "text-background/60" : "text-muted"
                    }`}
                  >
                    {counts[f]}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="ml-auto font-mono-nums text-[10px] text-muted tracking-wide whitespace-nowrap hidden sm:block">
            {markets.length} MARKETS
          </span>
        </div>
      </div>

      {/* ─── Market grid ─── */}
      <section className="max-w-6xl mx-auto px-6 py-6 pb-20">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-sm text-dim mb-1">
              No markets in this filter
            </div>
            <button
              onClick={() => setFilter("All")}
              className="text-xs text-avax hover:underline focus-ring rounded"
            >
              Show all markets
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((market, i) => (
              <div
                key={market.address}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <MarketCard market={market} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function HomeChrome() {
  const { markets } = useMarkets();
  return (
    <>
      <Ticker markets={markets} />
      <SiteHeader />
    </>
  );
}

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <HomeChrome />
      <Suspense fallback={<MarketsSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

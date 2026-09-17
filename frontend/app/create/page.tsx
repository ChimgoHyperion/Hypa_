"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useRouter } from "next/navigation";
import { decodeEventLog } from "viem";
import Link from "next/link";
import { useIsAdmin } from "@/app/hooks/useIsAdmin";
import { ConnectWallet } from "@/app/components/ConnectWallet";
import { SiteHeader } from "@/app/components/SiteHeader";
import { MarketThumb } from "@/app/components/MarketThumb";
import {
  SELECTABLE_CATEGORIES,
  CATEGORY_STYLES,
  CATEGORY_HINTS,
  type Category,
} from "@/app/lib/category";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/app/config/contracts";

const INPUT_CLASS =
  "w-full bg-background border border-border-strong rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-muted transition-colors";

const PRESETS = [
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 24 * 7 },
  { label: "30 days", hours: 24 * 30 },
  { label: "90 days", hours: 24 * 90 },
] as const;

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatCloseLabel(isoLocal: string) {
  if (!isoLocal) return "Not set";
  const d = new Date(isoLocal);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default function CreatePage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const { isAdmin } = useIsAdmin();

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<Category>("Crypto");
  const [endDate, setEndDate] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  const { writeContract, data: hash, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({ hash });

  const createdAddress = useMemo(() => {
    if (!receipt) return null;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "MarketCreated") {
          const args = decoded.args as { marketAddress?: `0x${string}` };
          if (args.marketAddress) return args.marketAddress;
        }
      } catch {
        // Not our event
      }
    }
    return null;
  }, [receipt]);

  function applyPreset(hours: number) {
    // eslint-disable-next-line react-hooks/purity -- user gesture sets a wall-clock close time
    const d = new Date(Date.now() + hours * 60 * 60 * 1000);
    setEndDate(toLocalInputValue(d));
    setValidationError("");
  }

  function createMarket() {
    const trimmed = question.trim();
    if (!trimmed) {
      setValidationError("Add a clear yes/no question.");
      return;
    }
    if (trimmed.length < 12) {
      setValidationError("Question is too short to be resolvable.");
      return;
    }
    if (!category) {
      setValidationError("Select a category.");
      return;
    }
    if (!endDate) {
      setValidationError("Pick when betting should close.");
      return;
    }

    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
    if (Number.isNaN(endTimestamp)) {
      setValidationError("Invalid close time.");
      return;
    }
    if (endTimestamp <= Math.floor(Date.now() / 1000) + 60) {
      setValidationError("Close time must be at least one minute from now.");
      return;
    }

    // Resolution notes stay off-chain for the creator; on-chain question stays clean.
    void resolutionNotes;

    setValidationError("");
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "createMarket",
      args: [trimmed, BigInt(endTimestamp), category],
    });
  }

  const canSubmit =
    question.trim().length >= 12 && !!endDate && !!category && isConnected;
  const charCount = question.trim().length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {!isAdmin ? (
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="text-lg mb-2">Creators only</div>
          <p className="text-sm text-muted mb-6">
            Market creation is restricted to authorized creators. Markets are
            curated so every question has a clear, resolvable outcome.
          </p>
          <Link
            href="/"
            className="inline-block text-sm px-5 py-2.5 rounded-lg border border-border-strong text-dim hover:text-foreground transition-colors focus-ring"
          >
            Back to markets
          </Link>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
          <Link
            href="/"
            className="text-[13px] text-muted hover:text-dim transition-colors rounded focus-ring"
          >
            ← Back to markets
          </Link>

          <div className="mt-5 mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Create a market
            </h1>
            <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
              Define a binary question, pick a topic, and set when betting
              closes. After close,{" "}
              <span className="text-dim">you resolve YES or NO</span> as the
              market creator — settlement is not automatic.
            </p>
          </div>

          {isSuccess ? (
            <div className="rounded-2xl border border-yes/40 bg-yes-bg/40 p-8 text-center max-w-xl mx-auto">
              <div className="font-mono-nums text-[10px] tracking-wider text-yes mb-2">
                DEPLOYED ON FUJI
              </div>
              <h2 className="text-xl font-semibold text-yes mb-2">
                Market created
              </h2>
              <p className="text-sm text-dim mb-6">
                Betting is live until {formatCloseLabel(endDate)}. When it
                ends, open the market and resolve the outcome.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {createdAddress ? (
                  <button
                    onClick={() => router.push(`/market/${createdAddress}`)}
                    className="px-6 py-3 rounded-lg bg-yes hover:bg-yes/90 text-white text-sm font-semibold transition-colors focus-ring"
                  >
                    Open market
                  </button>
                ) : null}
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-lg border border-border-strong text-sm text-dim hover:text-foreground transition-colors focus-ring"
                >
                  View all markets
                </button>
                <button
                  onClick={() => {
                    reset();
                    setQuestion("");
                    setResolutionNotes("");
                  }}
                  className="px-6 py-3 rounded-lg border border-border-strong text-sm text-dim hover:text-foreground transition-colors focus-ring"
                >
                  Create another
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
              <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 grid gap-7">
                {/* Question */}
                <div>
                  <div className="flex items-end justify-between gap-3 mb-2">
                    <label
                      htmlFor="question"
                      className="block text-[13px] font-medium text-foreground/80"
                    >
                      Question
                    </label>
                    <span className="font-mono-nums text-[10px] text-muted">
                      {charCount}/160
                    </span>
                  </div>
                  <textarea
                    id="question"
                    value={question}
                    maxLength={160}
                    rows={3}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Will AVAX close above $50 by Dec 31, 2026?"
                    className={`${INPUT_CLASS} resize-none leading-relaxed`}
                  />
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    <li>• Must resolve to a clear YES or NO</li>
                    <li>• Name a source of truth when the answer is ambiguous</li>
                    <li>• Avoid opinions — prefer measurable outcomes</li>
                  </ul>
                </div>

                {/* Category */}
                <div>
                  <div className="text-[13px] font-medium text-foreground/80 mb-2">
                    Category
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SELECTABLE_CATEGORIES.map((c) => {
                      const active = category === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          aria-pressed={active}
                          className={`text-left rounded-xl border px-3 py-2.5 transition-colors focus-ring ${
                            active
                              ? "border-foreground/40 bg-white/5"
                              : "border-border-strong hover:border-muted"
                          }`}
                        >
                          <span
                            className={`inline-block text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded border mb-1.5 ${CATEGORY_STYLES[c]}`}
                          >
                            {c}
                          </span>
                          <div className="text-[11px] text-muted leading-snug">
                            {CATEGORY_HINTS[c]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Close time */}
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-[13px] font-medium text-foreground/80 mb-2"
                  >
                    Betting closes
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPreset(p.hours)}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border-strong text-dim hover:text-foreground hover:border-muted transition-colors focus-ring"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setValidationError("");
                    }}
                    className={`${INPUT_CLASS} font-mono-nums`}
                  />
                  <p className="text-xs text-muted mt-1.5">
                    After this time, betting stops and only you can resolve the
                    outcome.
                  </p>
                </div>

                {/* Resolution notes (creator reminder, not stored on-chain) */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-[13px] font-medium text-foreground/80 mb-2"
                  >
                    Resolution criteria{" "}
                    <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Resolved using the daily close on CoinGecko at 00:00 UTC on the end date."
                    className={`${INPUT_CLASS} resize-none`}
                  />
                  <p className="text-xs text-muted mt-1.5">
                    For your notes only — not written on-chain. Put critical
                    rules in the question itself.
                  </p>
                </div>

                {/* Settlement reminder */}
                <div className="rounded-xl border border-border-strong bg-background/60 px-4 py-3.5">
                  <div className="font-mono-nums text-[10px] tracking-wider text-muted mb-2">
                    HOW SETTLEMENT WORKS
                  </div>
                  <ol className="space-y-1.5 text-xs text-dim list-decimal list-inside">
                    <li>Traders bet YES or NO with AVAX while the market is open</li>
                    <li>When the close time passes, betting locks</li>
                    <li>
                      You (the creator) resolve YES or NO from the market page
                    </li>
                    <li>Winners claim their share of the losing pool minus a 2% fee</li>
                  </ol>
                </div>

                {!isConnected ? (
                  <ConnectWallet />
                ) : (
                  <button
                    onClick={createMarket}
                    disabled={isPending || isConfirming || !canSubmit}
                    className="w-full py-3.5 rounded-lg bg-avax hover:bg-avax-hover text-white text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                  >
                    {isPending
                      ? "Confirm in wallet…"
                      : isConfirming
                      ? "Creating market…"
                      : "Create market on Fuji"}
                  </button>
                )}

                {(validationError || error) && (
                  <div className="text-xs text-no wrap-break-word" role="alert">
                    {validationError ||
                      ("shortMessage" in (error ?? {})
                        ? String(
                            (error as { shortMessage?: string }).shortMessage
                          )
                        : error?.message.slice(0, 160))}
                  </div>
                )}
              </div>

              {/* Sticky live preview */}
              <aside className="lg:sticky lg:top-20 space-y-4">
                <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
                  <div className="px-5 pt-4 pb-3 border-b border-border-subtle">
                    <div className="font-mono-nums text-[10px] tracking-wider text-muted">
                      LIVE PREVIEW
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <MarketThumb
                        address={FACTORY_ADDRESS}
                        question={question || "Preview market"}
                        category={category}
                        size={52}
                        rounded="rounded-xl"
                      />
                      <div className="min-w-0">
                        <span
                          className={`inline-block text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded border mb-1.5 ${CATEGORY_STYLES[category]}`}
                        >
                          {category}
                        </span>
                        <div className="text-sm leading-snug text-foreground/90">
                          {question.trim() || (
                            <span className="text-muted">
                              Your question appears here
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-lg bg-yes-bg border border-yes/20 px-3 py-2.5 text-center">
                        <div className="font-mono-nums text-lg text-yes">50%</div>
                        <div className="text-[10px] text-muted">Yes</div>
                      </div>
                      <div className="rounded-lg bg-no-bg border border-no/20 px-3 py-2.5 text-center">
                        <div className="font-mono-nums text-lg text-no">50%</div>
                        <div className="text-[10px] text-muted">No</div>
                      </div>
                    </div>

                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Closes</dt>
                        <dd className="text-dim text-right">
                          {formatCloseLabel(endDate)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Resolver</dt>
                        <dd className="text-dim">You (creator)</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Network</dt>
                        <dd className="font-mono-nums text-dim">Fuji · 43113</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <p className="text-[11px] text-muted leading-relaxed px-1">
                  Creating deploys a new PredictionMarket contract. Gas is paid
                  in test AVAX. Existing markets stay listed on the same factory.
                </p>
              </aside>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

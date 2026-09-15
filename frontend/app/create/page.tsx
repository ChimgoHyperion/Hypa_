"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/app/hooks/useIsAdmin";
import Link from "next/link";
import { ConnectWallet } from "@/app/components/ConnectWallet";
import { SiteHeader } from "@/app/components/SiteHeader";
import { MarketThumb } from "@/app/components/MarketThumb";
import { inferCategory, CATEGORY_STYLES } from "@/app/lib/category";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/app/config/contracts";

const INPUT_CLASS =
  "w-full bg-background border border-border-strong rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-muted transition-colors";

export default function CreatePage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const { isAdmin } = useIsAdmin();
  const [question, setQuestion] = useState("");
  const [endDate, setEndDate] = useState("");
  const [validationError, setValidationError] = useState("");

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function createMarket() {
    if (!question.trim() || !endDate) return;

    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

    if (endTimestamp <= Math.floor(Date.now() / 1000)) {
      setValidationError("End time must be in the future.");
      return;
    }

    setValidationError("");
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "createMarket",
      args: [question, BigInt(endTimestamp)],
    });
  }

  // Thumbnails are derived from the question text, so show the admin what
  // image and topic their wording will produce before they commit on-chain.
  const previewCategory = inferCategory(question || "");
  const canSubmit = question.trim().length > 0 && !!endDate;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {!isAdmin ? (
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="text-lg mb-2">Admin only</div>
          <p className="text-sm text-muted mb-6">
            Market creation is restricted to authorized creators. Markets are
            curated to ensure clear, resolvable questions.
          </p>
          <Link
            href="/"
            className="inline-block text-sm px-5 py-2.5 rounded-lg border border-border-strong text-dim hover:text-foreground transition-colors focus-ring"
          >
            Back to markets
          </Link>
        </div>
      ) : (
        <div className="max-w-xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="text-[13px] text-muted hover:text-dim transition-colors rounded focus-ring"
          >
            ← Back to markets
          </Link>

          <h1 className="text-2xl font-semibold mt-5 mb-2">Create a market</h1>
          <p className="text-sm text-muted mb-8">
            Ask a yes/no question. You&apos;ll resolve it after it ends.
          </p>

          {isSuccess ? (
            <div className="bg-surface border border-yes/50 rounded-2xl p-6 text-center">
              <div className="text-base text-yes mb-4">Market created</div>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-lg bg-yes hover:bg-yes/90 text-white text-sm font-semibold transition-colors focus-ring"
              >
                View all markets
              </button>
            </div>
          ) : (
            <div className="bg-surface border border-border-subtle rounded-2xl p-6 grid gap-5">
              <div>
                <label
                  htmlFor="question"
                  className="block text-[13px] font-medium text-foreground/80 mb-2"
                >
                  Question
                </label>
                <input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Will AVAX close above $50 by Dec 2026?"
                  className={INPUT_CLASS}
                />
                <div className="text-xs text-muted mt-1.5">
                  Must have a clear yes/no answer.
                </div>
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-[13px] font-medium text-foreground/80 mb-2"
                >
                  Betting closes
                </label>
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
                <div className="text-xs text-muted mt-1.5">
                  After this, you can resolve the outcome.
                </div>
              </div>

              {/* Live preview of how the market will appear in the grid */}
              <div className="border-t border-border-subtle pt-5">
                <div className="font-mono-nums text-[10px] tracking-wider text-muted mb-3">
                  PREVIEW
                </div>
                <div className="flex items-start gap-3">
                  <MarketThumb
                    address={FACTORY_ADDRESS}
                    question={question}
                    category={previewCategory}
                  />
                  <div className="min-w-0">
                    <span
                      className={`inline-block text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded border mb-1.5 ${CATEGORY_STYLES[previewCategory]}`}
                    >
                      {previewCategory}
                    </span>
                    <div className="text-[13px] leading-snug text-foreground/90">
                      {question.trim() || (
                        <span className="text-muted">
                          Your question appears here
                        </span>
                      )}
                    </div>
                  </div>
                </div>
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
                    : "Create market"}
                </button>
              )}

              {validationError && (
                <div className="text-xs text-no">{validationError}</div>
              )}
              {error && (
                <div className="text-xs text-no wrap-break-word">
                  {error.message.slice(0, 120)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

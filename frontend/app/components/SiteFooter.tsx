import Link from "next/link";
import { FACTORY_ADDRESS } from "@/app/config/contracts";
import { CATEGORIES } from "@/app/lib/category";
import { Logo } from "./Logo";

const SNOWTRACE = "https://testnet.snowtrace.io";
const REPO = "https://github.com/icodejsx/Hypa_";

const PROTOCOL_LINKS = [
  { label: "Factory contract", href: `${SNOWTRACE}/address/${FACTORY_ADDRESS}#code` },
  { label: "Source code", href: REPO },
  { label: "How settlement works", href: `${REPO}#architecture` },
  { label: "Known limitations", href: `${REPO}#known-limitations` },
  { label: "Roadmap", href: `${REPO}#roadmap` },
];

const DISCORD = "https://discord.gg/ncBbMtyS7";

const RESOURCE_LINKS = [
  { label: "Join the community", href: DISCORD },
  { label: "Get testnet AVAX", href: "https://faucet.avax.network" },
  { label: "Snowtrace explorer", href: SNOWTRACE },
  { label: "Avalanche docs", href: "https://build.avax.network/docs" },
  { label: "Install a wallet", href: "https://metamask.io/download" },
];

const LEGAL_LINKS = [
  { label: "Discord", href: DISCORD },
  { label: "Source", href: REPO },
  { label: "Contract", href: `${SNOWTRACE}/address/${FACTORY_ADDRESS}#code` },
  { label: "Faucet", href: "https://faucet.avax.network" },
];

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-muted hover:text-foreground transition-colors rounded focus-ring"
    >
      {label}
    </a>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border-subtle bg-surface/30">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Logo markHeight={34} />

            <p className="mt-3 text-xs leading-relaxed text-muted max-w-xs">
              Prediction markets, settled on-chain. Built natively for
              Avalanche.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border-strong px-2.5 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-yes opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yes" />
              </span>
              <span className="font-mono-nums text-[10px] uppercase tracking-wide text-dim">
                Fuji testnet · Live
              </span>
            </div>
          </div>

          <nav aria-labelledby="footer-markets">
            <h2
              id="footer-markets"
              className="text-[11px] font-semibold uppercase tracking-wide text-dim mb-3"
            >
              Markets
            </h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-xs text-muted hover:text-foreground transition-colors rounded focus-ring"
                >
                  All markets
                </Link>
              </li>
              {CATEGORIES.filter((category) => category !== "Other").map(
                (category) => (
                  <li key={category}>
                    <Link
                      href={`/?category=${encodeURIComponent(category)}`}
                      className="text-xs text-muted hover:text-foreground transition-colors rounded focus-ring"
                    >
                      {category}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>

          <nav aria-labelledby="footer-protocol">
            <h2
              id="footer-protocol"
              className="text-[11px] font-semibold uppercase tracking-wide text-dim mb-3"
            >
              Protocol
            </h2>
            <ul className="space-y-2">
              {PROTOCOL_LINKS.map((link) => (
                <li key={link.label}>
                  <ExternalLink {...link} />
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-resources">
            <h2
              id="footer-resources"
              className="text-[11px] font-semibold uppercase tracking-wide text-dim mb-3"
            >
              Resources
            </h2>
            <ul className="space-y-2">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <ExternalLink {...link} />
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-border-subtle">
          <p className="text-[11px] leading-relaxed text-muted max-w-3xl">
            Hypa runs on the Avalanche Fuji test network. Markets trade in test
            AVAX with no monetary value, contracts are unaudited, and outcomes
            are resolved by the market creator. Nothing here is financial
            advice.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="font-mono-nums text-[11px] text-muted">
              © {year} Hypa
            </span>
            {LEGAL_LINKS.map((link) => (
              <ExternalLink key={link.label} {...link} />
            ))}
            <span className="sm:ml-auto font-mono-nums text-[10px] uppercase tracking-wide text-muted">
              Chain 43113
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export type Category =
  | "Crypto"
  | "Finance"
  | "Sports"
  | "Politics"
  | "Technology"
  | "Pop Culture"
  | "Other";

export const CATEGORIES: Category[] = [
  "Crypto",
  "Finance",
  "Sports",
  "Politics",
  "Technology",
  "Pop Culture",
  "Other",
];

/** Categories creators can pick on the create form (excludes catch-all Other). */
export const SELECTABLE_CATEGORIES: Category[] = CATEGORIES.filter(
  (c) => c !== "Other"
);

export function parseCategory(value: unknown): Category | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  return (CATEGORIES as string[]).includes(trimmed)
    ? (trimmed as Category)
    : null;
}

/** Prefer the on-chain category when present; otherwise infer from the question. */
export function resolveCategory(
  question: string,
  onChainCategory?: string | null
): Category {
  return parseCategory(onChainCategory) ?? inferCategory(question);
}

export function inferCategory(question: string): Category {
  const q = question.toLowerCase();

  if (
    /\b(avax|btc|bitcoin|eth|ethereum|sol|solana|hype|hyperliquid|doge|xrp|bnb|crypto|token|coin|defi|nft|stablecoin|airdrop|halving)\b/.test(
      q
    )
  ) {
    return "Crypto";
  }
  if (
    /\b(elections?|midterms?|democrats?|republicans?|president|presidential|vote|voter|senate|congress|policy|law|legislation|minister|parliament|party|governor|campaign|impeach)\b/.test(
      q
    )
  ) {
    return "Politics";
  }
  if (
    /\b(beat|win|wins|match|cup|game|team|score|league|final|finals|championship|quarterfinal|arsenal|transfer|goal|fc)\b/.test(
      q
    )
  ) {
    return "Sports";
  }
  if (
    /\b(ai|gpt|openai|anthropic|claude|apple|google|samsung|tesla|iphone|launch|chip|software|model|robot|robotaxi|spacex|starship)\b/.test(
      q
    )
  ) {
    return "Technology";
  }
  if (
    /\b(movie|film|album|song|grammy|oscar|netflix|disney|avatar|bbnaija|reality|celebrity|tour|box office|series|gta|rockstar|gaming)\b/.test(
      q
    )
  ) {
    return "Pop Culture";
  }
  if (
    /\b(stock|stocks|shares|index|s&p|gold|revenue|refinery|valued|valuation|ipo|inflation|rate|rates|gdp|earnings|nasdaq|fed|bank of england)\b/.test(
      q
    ) ||
    /\$\d/.test(q)
  ) {
    return "Finance";
  }
  return "Other";
}

/**
 * Tailwind classes per category, used for the badge on each market box.
 * Kept as literal strings so Tailwind's scanner picks them up.
 */
export const CATEGORY_STYLES: Record<Category, string> = {
  Crypto: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Finance: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Sports: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Politics: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Technology: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Pop Culture": "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
  Other: "bg-white/5 text-dim border-border-strong",
};

export const CATEGORY_HINTS: Record<Category, string> = {
  Crypto: "Tokens, protocols, TVL, and on-chain events",
  Finance: "Rates, stocks, indices, and macro moves",
  Sports: "Matches, tournaments, and player awards",
  Politics: "Elections, legislation, and policy",
  Technology: "Products, AI launches, and big tech",
  "Pop Culture": "Games, film, music, and celebrities",
  Other: "Anything that does not fit the topics above",
};

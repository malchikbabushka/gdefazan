export type SearchHit = {
  id: string;
  title: string;
  subtitle?: string;
  score: number;
  matchedRanges: Array<[number, number]>;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeRanges(ranges: Array<[number, number]>) {
  if (ranges.length === 0) return ranges;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i]!;
    const last = out[out.length - 1]!;
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

/**
 * iOS-like ranking:
 * - strong boost for prefix match of any word
 * - then substring match
 * - then subsequence match (characters in order)
 */
export function scoreQuery(haystackRaw: string, queryRaw: string) {
  const haystack = normalize(haystackRaw);
  const query = normalize(queryRaw);
  if (!query) return { score: 0, ranges: [] as Array<[number, number]> };

  const ranges: Array<[number, number]> = [];
  let score = 0;

  // Token prefix match
  const tokens = haystack.split(" ");
  const qTokens = query.split(" ").filter(Boolean);
  if (qTokens.length) {
    let prefixHits = 0;
    for (const qt of qTokens) {
      let best = -1;
      for (const t of tokens) {
        if (t.startsWith(qt)) best = Math.max(best, qt.length);
      }
      if (best > 0) {
        prefixHits++;
        score += 400 + best * 6;
      }
    }
    if (prefixHits === qTokens.length) score += 120;
  }

  // Substring match
  const idx = haystack.indexOf(query);
  if (idx >= 0) {
    score += 250 + Math.min(120, query.length * 10);
    ranges.push([idx, idx + query.length]);
  }

  // Subsequence match
  // (useful for "sytn" -> "sytong")
  let hi = 0;
  let matched = 0;
  const seqRanges: Array<[number, number]> = [];
  let rangeStart: number | null = null;
  for (let qi = 0; qi < query.length; qi++) {
    const qc = query[qi]!;
    if (qc === " ") continue;
    while (hi < haystack.length && haystack[hi] !== qc) {
      if (rangeStart !== null) {
        seqRanges.push([rangeStart, hi]);
        rangeStart = null;
      }
      hi++;
    }
    if (hi < haystack.length && haystack[hi] === qc) {
      matched++;
      if (rangeStart === null) rangeStart = hi;
      hi++;
    } else {
      matched = 0;
      break;
    }
  }
  if (matched > 0) {
    if (rangeStart !== null) seqRanges.push([rangeStart, hi]);
    score += 80 + matched * 8;
    ranges.push(...seqRanges);
  }

  // Small boost for shorter strings when tied
  score += Math.max(0, 40 - haystack.length * 0.2);

  return { score, ranges: mergeRanges(ranges) };
}

export function topMatches<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  limit = 8,
) {
  const hits = items
    .map((item) => {
      const text = getText(item);
      const { score, ranges } = scoreQuery(text, query);
      return { item, text, score, ranges };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return hits;
}


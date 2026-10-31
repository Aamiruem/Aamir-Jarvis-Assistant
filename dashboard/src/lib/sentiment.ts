export type SentimentBucket = "positive" | "neutral" | "negative";

/** The NLP service scores sentiment from -1 (negative) to +1 (positive). */
export function sentimentBucket(score: number | null | undefined): SentimentBucket {
  if (score == null || Math.abs(score) < 0.05) return "neutral";
  return score > 0 ? "positive" : "negative";
}

export function countSentiment(scores: (number | null | undefined)[]) {
  const counts: Record<SentimentBucket, number> = { positive: 0, neutral: 0, negative: 0 };
  for (const s of scores) counts[sentimentBucket(s)]++;
  return counts;
}

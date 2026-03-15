/**
 * Smart headline truncation — never cuts mid-phrase.
 * Removes trailing dangling words (prepositions, articles, conjunctions)
 * so headlines always read as complete thoughts.
 */

const DANGLING_WORDS = new Set([
  "de", "du", "des", "le", "la", "les", "l'", "un", "une",
  "et", "ou", "mais", "si", "que", "qui", "pour", "avec", "sans", "car",
  "donc", "en", "au", "aux", "ce", "cette", "ces", "son", "sa", "ses",
  "ton", "ta", "tes", "mon", "ma", "mes", "votre", "vos", "leur", "leurs",
  "ne", "n'", "pas", "plus", "dans", "sur", "par", "a", "à",
]);

/**
 * Truncate a headline to maxWords while ensuring it ends on a
 * semantically complete word (not a preposition/article/conjunction).
 */
export function smartTruncateHeadline(headline: string, maxWords = 10): string {
  if (!headline) return headline;

  let words = headline.trim().split(/\s+/);

  // Step 1: If over budget, find best cut point working backwards
  if (words.length > maxWords) {
    for (let i = maxWords; i >= 4; i--) {
      const lastWord = words[i - 1].toLowerCase().replace(/[.,!?;:'"«»""…]/g, "");
      if (!DANGLING_WORDS.has(lastWord)) {
        words = words.slice(0, i);
        break;
      }
    }
    // If we couldn't find a clean break, force cut at budget
    if (words.length > maxWords) {
      words = words.slice(0, maxWords);
    }
  }

  // Step 2: Even if under budget, strip trailing dangling words
  while (words.length > 3) {
    const lastWord = words[words.length - 1].toLowerCase().replace(/[.,!?;:'"«»""…]/g, "");
    if (DANGLING_WORDS.has(lastWord)) {
      words.pop();
    } else {
      break;
    }
  }

  return words.join(" ");
}

/**
 * Robustly extract JSON from a Claude response that may contain
 * markdown code fences, stray backticks, or other wrapper text.
 */
export function extractJsonFromResponse(text: string): string {
  let jsonStr = text.trim();

  // Strip markdown code fences (greedy to handle nested backticks)
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  // Strip stray leading/trailing backticks
  jsonStr = jsonStr.replace(/^`+(?:json)?\s*/, "").replace(/\s*`+$/, "");

  return jsonStr.trim();
}

/**
 * Robustly extract JSON from a Claude response that may contain
 * markdown code fences, stray backticks, or other wrapper text.
 * Also attempts to repair truncated/malformed JSON.
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

  jsonStr = jsonStr.trim();

  // Try parsing as-is first
  try {
    JSON.parse(jsonStr);
    return jsonStr;
  } catch {
    // Continue with repair attempts
  }

  // Remove trailing commas before } or ] (common Claude mistake)
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");

  // Remove JS-style comments
  jsonStr = jsonStr.replace(/\/\/[^\n]*/g, "");

  // If JSON is truncated (incomplete), try to close it
  try {
    JSON.parse(jsonStr);
    return jsonStr;
  } catch {
    // Attempt to close truncated JSON
    return repairTruncatedJson(jsonStr);
  }
}

/**
 * Attempt to repair truncated JSON by closing unclosed brackets,
 * braces, and strings.
 */
function repairTruncatedJson(jsonStr: string): string {
  // Remove any trailing partial key/value (text after last complete value)
  // Find the last valid structural character
  let repaired = jsonStr;

  // Remove trailing partial string (unclosed quote)
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // Odd number of quotes — find last quote and truncate or close
    const lastQuoteIdx = repaired.lastIndexOf('"');
    // Check if it's a key waiting for value or a truncated string value
    const afterQuote = repaired.slice(lastQuoteIdx + 1).trim();
    if (afterQuote === "" || afterQuote === ":" || afterQuote === ",") {
      // Truncated mid-key or mid-value — remove from last complete structure
      repaired = repaired.slice(0, lastQuoteIdx);
      // Remove trailing colon, comma, or whitespace
      repaired = repaired.replace(/[,:"\s]+$/, "");
    } else {
      // Close the string
      repaired += '"';
    }
  }

  // Remove dangling comma or colon at the end
  repaired = repaired.replace(/[,:\s]+$/, "");

  // Count unclosed brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of repaired) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  // Close in reverse order (brackets first if they were opened last)
  // Simple heuristic: close all open structures
  while (openBrackets > 0) { repaired += "]"; openBrackets--; }
  while (openBraces > 0) { repaired += "}"; openBraces--; }

  return repaired;
}

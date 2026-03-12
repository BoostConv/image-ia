/**
 * Shared retry wrapper for all Claude API calls.
 * Handles rate limits (429), overloaded (529), and server errors (5xx)
 * with exponential backoff.
 */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callClaudeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 4
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err as Error;
      const status = (err as { status?: number }).status;
      const isRateLimit = status === 429;
      const isOverloaded = status === 529;
      const isServerError = status !== undefined && status >= 500;

      if (isRateLimit || isOverloaded) {
        const delay = Math.pow(2, attempt) * 3000;
        console.warn(
          `[Claude] Rate limit (${status}), retry ${attempt + 1}/${maxRetries} in ${delay}ms`
        );
        await sleep(delay);
        continue;
      }

      if (isServerError) {
        console.warn(
          `[Claude] Server error (${status}), retry ${attempt + 1}/${maxRetries} in 5000ms`
        );
        await sleep(5000);
        continue;
      }

      // Non-retryable error
      throw err;
    }
  }
  throw lastError || new Error("Claude API: echec apres retries");
}

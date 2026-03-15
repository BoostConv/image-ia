/**
 * Instagram scraper — best-effort approach.
 * Instagram aggressively blocks scraping, so this is a degraded source.
 * Returns image URLs from the public profile if accessible.
 */

export interface InstagramProfileData {
  username: string;
  fullName?: string;
  biography?: string;
  profilePicUrl?: string;
  postImageUrls: string[];
}

/**
 * Attempts to fetch Instagram profile and recent post images.
 * Uses the public profile HTML — may return empty if blocked.
 */
export async function fetchInstagramImages(
  handle: string,
  limit = 8,
): Promise<string[]> {
  const cleanHandle = handle.replace(/^@/, "").trim();
  if (!cleanHandle) return [];

  // Strategy 1: Try the public JSON endpoint (sometimes works)
  try {
    const jsonUrl = `https://www.instagram.com/${cleanHandle}/?__a=1&__d=dis`;
    const res = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        Accept: "application/json",
        "X-IG-App-ID": "936619743392459",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      const edges = data?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
      const urls = edges
        .slice(0, limit)
        .map((e: any) => e.node?.display_url || e.node?.thumbnail_src)
        .filter(Boolean);
      if (urls.length > 0) {
        console.log(`[Instagram] Found ${urls.length} images via JSON API for @${cleanHandle}`);
        return urls;
      }
    }
  } catch {
    // Expected to fail often
  }

  // Strategy 2: Parse the HTML page for embedded data
  try {
    const htmlUrl = `https://www.instagram.com/${cleanHandle}/`;
    const res = await fetch(htmlUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[Instagram] HTTP ${res.status} for @${cleanHandle}`);
      return [];
    }

    const html = await res.text();

    // Look for og:image (at least get the profile/featured image)
    const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
    const images: string[] = [];
    if (ogMatch) images.push(ogMatch[1]);

    // Look for embedded JSON with image URLs
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*(\{.+?\});<\/script>/);
    if (sharedDataMatch) {
      try {
        const sharedData = JSON.parse(sharedDataMatch[1]);
        const edges = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
        for (const edge of edges.slice(0, limit)) {
          const url = edge.node?.display_url || edge.node?.thumbnail_src;
          if (url) images.push(url);
        }
      } catch {
        // JSON parse failed
      }
    }

    // Additional data match patterns
    const additionalDataMatch = html.match(/"edge_owner_to_timeline_media":\{"count":\d+,"page_info":\{[^}]+\},"edges":\[(.*?)\]\}/);
    if (additionalDataMatch) {
      try {
        const edgesStr = `[${additionalDataMatch[1]}]`;
        const edges = JSON.parse(edgesStr);
        for (const edge of edges.slice(0, limit)) {
          const url = edge.node?.display_url || edge.node?.thumbnail_src;
          if (url && !images.includes(url)) images.push(url);
        }
      } catch {
        // Parse failed
      }
    }

    if (images.length > 0) {
      console.log(`[Instagram] Found ${images.length} images via HTML for @${cleanHandle}`);
    } else {
      console.warn(`[Instagram] No images found for @${cleanHandle} (likely blocked by Instagram)`);
    }

    return [...new Set(images)].slice(0, limit);
  } catch (e) {
    console.warn(`[Instagram] Fetch failed for @${cleanHandle}:`, e);
    return [];
  }
}

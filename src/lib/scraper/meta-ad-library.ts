import * as cheerio from "cheerio";

export interface MetaAdResult {
  adId: string;
  pageId: string;
  pageName: string;
  imageUrl?: string;
  body?: string;
  startDate?: string;
  status?: string;
}

/**
 * Extracts the Facebook numeric page ID from a page URL.
 * Works with formats like:
 * - facebook.com/pagename
 * - facebook.com/profile.php?id=123
 * - facebook.com/pages/Name/123
 */
export function extractPageIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // Direct numeric ID
    const idParam = u.searchParams.get("id");
    if (idParam && /^\d+$/.test(idParam)) return idParam;

    // /pages/Name/123456
    const pagesMatch = u.pathname.match(/\/pages\/[^/]+\/(\d+)/);
    if (pagesMatch) return pagesMatch[1];

    // Vanity URL — extract slug, will need API resolution
    const slug = u.pathname.replace(/^\//, "").replace(/\/$/, "").split("/")[0];
    if (slug && slug !== "pages" && slug !== "profile.php") return slug;

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches ads from the Meta Ad Library API.
 * Requires META_AD_LIBRARY_TOKEN env var (long-lived app access token).
 * Returns ad data including snapshot URLs for screenshot downloading.
 */
export async function fetchMetaAds(
  pageIdOrSlug: string,
  limit = 10,
): Promise<MetaAdResult[]> {
  const token = process.env.META_AD_LIBRARY_TOKEN;
  if (!token) {
    console.warn("[MetaAdLibrary] No META_AD_LIBRARY_TOKEN configured, skipping");
    return [];
  }

  // If pageIdOrSlug is not numeric, try to resolve it
  let pageId = pageIdOrSlug;
  if (!/^\d+$/.test(pageId)) {
    try {
      const resolveRes = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}?fields=id,name&access_token=${token}`,
        { signal: AbortSignal.timeout(10000) },
      );
      if (resolveRes.ok) {
        const data = await resolveRes.json();
        pageId = data.id;
      } else {
        console.warn(`[MetaAdLibrary] Could not resolve page slug "${pageIdOrSlug}"`);
        return [];
      }
    } catch (e) {
      console.warn("[MetaAdLibrary] Page resolution failed:", e);
      return [];
    }
  }

  try {
    const params = new URLSearchParams({
      access_token: token,
      ad_reached_countries: '["FR"]',
      search_page_ids: pageId,
      ad_active_status: "ALL",
      ad_type: "POLITICAL_AND_ISSUE_ADS",
      fields: "id,ad_snapshot_url,ad_creative_bodies,page_id,page_name,ad_delivery_start_time,ad_delivery_stop_time",
      limit: String(limit),
    });

    // Try with POLITICAL_AND_ISSUE_ADS first (broader), fallback to ALL
    for (const adType of ["ALL"]) {
      params.set("ad_type", adType);
      const res = await fetch(
        `https://graph.facebook.com/v19.0/ads_archive?${params}`,
        { signal: AbortSignal.timeout(20000) },
      );

      if (!res.ok) {
        const err = await res.text();
        console.warn(`[MetaAdLibrary] API error (type=${adType}):`, err);
        continue;
      }

      const data = await res.json();
      if (data.data?.length > 0) {
        return data.data.map((ad: any) => ({
          adId: ad.id,
          pageId: ad.page_id,
          pageName: ad.page_name,
          imageUrl: ad.ad_snapshot_url,
          body: ad.ad_creative_bodies?.[0],
          startDate: ad.ad_delivery_start_time,
          status: ad.ad_delivery_stop_time ? "inactive" : "active",
        }));
      }
    }

    return [];
  } catch (e) {
    console.warn("[MetaAdLibrary] Fetch failed:", e);
    return [];
  }
}

/**
 * Scrape the public Meta Ad Library HTML page as a fallback
 * when no API token is configured.
 * This is less reliable but works without authentication.
 */
export async function scrapeMetaAdLibraryPage(
  pageIdOrSlug: string,
): Promise<string[]> {
  try {
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=FR&view_all_page_id=${encodeURIComponent(pageIdOrSlug)}&media_type=image`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);

    // Try to extract image URLs from the page
    const imageUrls: string[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && src.includes("scontent") && !src.includes("emoji")) {
        imageUrls.push(src);
      }
    });

    // Also look in JSON-LD or embedded data
    const jsonMatches = html.match(/"image":\s*\{[^}]*"uri":\s*"([^"]+)"/g) || [];
    for (const m of jsonMatches) {
      const uriMatch = m.match(/"uri":\s*"([^"]+)"/);
      if (uriMatch) {
        imageUrls.push(uriMatch[1].replace(/\\\//g, "/"));
      }
    }

    return [...new Set(imageUrls)].slice(0, 10);
  } catch {
    return [];
  }
}

import { NextResponse } from "next/server";
import { getPendingRevisionCount } from "@/lib/db/queries/revisions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await getPendingRevisionCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Revision count error:", error);
    return NextResponse.json({ count: 0 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const dir = path.join(process.cwd(), "data", "images", "brands", brandId);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `logo.${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const logoPath = `data/images/brands/${brandId}/logo.${ext}`;

    await db
      .update(brands)
      .set({ logoPath, updatedAt: new Date().toISOString() })
      .where(eq(brands.id, brandId));

    return NextResponse.json({ logoPath });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du logo" },
      { status: 500 }
    );
  }
}

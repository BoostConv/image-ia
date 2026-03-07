import { NextRequest, NextResponse } from "next/server";
import { createProduct, deleteProduct, getProductById } from "@/lib/db/queries/brands";
import { saveImage } from "@/lib/images/storage";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload for product reference images
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const productId = formData.get("productId") as string;

      if (!file || !productId) {
        return NextResponse.json(
          { error: "Fichier et productId requis" },
          { status: 400 }
        );
      }

      const product = await getProductById(productId);
      if (!product) {
        return NextResponse.json(
          { error: "Produit introuvable" },
          { status: 404 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `ref_${nanoid()}.${ext}`;
      const subDir = `brands/${product.brandId}/products/${productId}`;
      const filePath = await saveImage(buffer, subDir, fileName);

      const currentImages = product.imagePaths || [];
      const updatedImages = [...currentImages, filePath];

      await db
        .update(products)
        .set({ imagePaths: updatedImages })
        .where(eq(products.id, productId));

      return NextResponse.json({ filePath, imagePaths: updatedImages });
    }

    // Handle JSON product creation
    const body = await request.json();
    const {
      brandId,
      name,
      category,
      usp,
      benefits,
      objections,
      pricing,
      positioning,
      season,
      usageContext,
      marketingArguments,
      targetAudience,
      competitiveAdvantage,
      imagePaths,
    } = body;

    if (!brandId || !name?.trim()) {
      return NextResponse.json(
        { error: "brandId et nom requis" },
        { status: 400 }
      );
    }

    const id = await createProduct({
      brandId,
      name,
      category,
      usp,
      benefits,
      objections,
      pricing,
      positioning,
      season,
      usageContext,
    });

    // Update extra fields separately (not in createProduct)
    const extraUpdates: Record<string, unknown> = {};
    if (marketingArguments) extraUpdates.marketingArguments = marketingArguments;
    if (targetAudience) extraUpdates.targetAudience = targetAudience;
    if (competitiveAdvantage) extraUpdates.competitiveAdvantage = competitiveAdvantage;
    if (imagePaths?.length) extraUpdates.imagePaths = imagePaths;

    if (Object.keys(extraUpdates).length > 0) {
      await db
        .update(products)
        .set(extraUpdates)
        .where(eq(products.id, id));
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Product API error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await db.update(products).set(updates).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

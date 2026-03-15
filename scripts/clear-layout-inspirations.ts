import { db } from "../src/lib/db";
import { layoutInspirations } from "../src/lib/db/schema";
import fs from "fs";
import path from "path";

async function main() {
  const all = await db.select().from(layoutInspirations);
  console.log(`Current records: ${all.length}`);

  await db.delete(layoutInspirations);
  console.log("Deleted all layout inspirations from DB");

  const dir = path.join(process.cwd(), "uploads/layouts");
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
    console.log("Deleted uploads/layouts/");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

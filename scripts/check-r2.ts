import { r2ListAll, r2BucketBytes } from "../src/lib/r2";

async function main() {
  const bytes = await r2BucketBytes();
  const objects = await r2ListAll();
  console.log(`R2: ${objects.length} objects, ${(bytes / 1024).toFixed(1)} KB total`);
  if (objects.length > 0) {
    console.log("Sample keys:");
    for (const o of objects.slice(0, 5)) console.log(`  ${o.key} (${o.size} bytes)`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });

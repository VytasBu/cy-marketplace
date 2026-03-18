/**
 * Generate PWA icons from an SVG source.
 * Run: npx tsx scripts/generate-icons.ts
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const PUBLIC = join(__dirname, "..", "public");
const ICONS = join(PUBLIC, "icons");

// Brand color from the app's design system
const THEME_COLOR = "#5686CC";

// SVG source icon — "CY" text on branded background
const createSvg = (size: number, maskable: boolean) => {
  const padding = maskable ? Math.round(size * 0.2) : Math.round(size * 0.08);
  const innerSize = size - padding * 2;
  const fontSize = Math.round(innerSize * 0.42);
  const cornerRadius = Math.round(size * 0.18);

  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="${THEME_COLOR}"/>
      <text
        x="50%"
        y="52%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-weight="700"
        font-size="${fontSize}"
        fill="white"
        letter-spacing="${Math.round(fontSize * 0.05)}"
      >CY</text>
    </svg>
  `);
};

async function generate() {
  const icons = [
    { name: "icon-192x192.png", size: 192, maskable: false },
    { name: "icon-512x512.png", size: 512, maskable: false },
    { name: "icon-maskable-192x192.png", size: 192, maskable: true },
    { name: "icon-maskable-512x512.png", size: 512, maskable: true },
    { name: "favicon-32x32.png", size: 32, maskable: false },
    { name: "favicon-16x16.png", size: 16, maskable: false },
  ];

  for (const icon of icons) {
    const svg = createSvg(icon.size, icon.maskable);
    const png = await sharp(svg).resize(icon.size, icon.size).png().toBuffer();
    const outPath = join(ICONS, icon.name);
    writeFileSync(outPath, png);
    console.log(`✓ ${icon.name} (${icon.size}x${icon.size})`);
  }

  // Apple touch icon (180x180) goes in public root
  const appleSvg = createSvg(180, false);
  const applePng = await sharp(appleSvg).resize(180, 180).png().toBuffer();
  writeFileSync(join(PUBLIC, "apple-touch-icon.png"), applePng);
  console.log("✓ apple-touch-icon.png (180x180)");

  console.log("\nDone! All icons generated.");
}

generate().catch(console.error);

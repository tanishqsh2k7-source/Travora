import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const destinationsDir = path.join(publicDir, "images/destinations");

const WIDTHS = [640, 1024, 1600, 2400];

async function optimizeImage(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);

  if (ext.toLowerCase() !== ".jpg" && ext.toLowerCase() !== ".jpeg" && ext.toLowerCase() !== ".png") {
    return;
  }

  // Skip already generated resized variants
  if (baseName.includes("-640") || baseName.includes("-1024") || baseName.includes("-1600") || baseName.includes("-2400")) {
    return;
  }

  const image = sharp(filePath);
  const metadata = await image.metadata();

  console.log(`Optimizing: ${path.relative(publicDir, filePath)} (${metadata.width}x${metadata.height})`);

  for (const width of WIDTHS) {
    if (metadata.width && metadata.width < width * 0.8) {
      continue; // Don't upscale
    }

    // Generate WebP
    const webpQuality = width >= 2400 ? 75 : 80;
    const webpPath = path.join(dir, `${baseName}-${width}.webp`);
    await sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: webpQuality, effort: 6 })
      .withMetadata(false)
      .toFile(webpPath);

    // Generate AVIF
    const avifQuality = width >= 2400 ? 68 : 74;
    const avifPath = path.join(dir, `${baseName}-${width}.avif`);
    await sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: avifQuality, effort: 6 })
      .withMetadata(false)
      .toFile(avifPath);

    const webpStat = fs.statSync(webpPath);
    const avifStat = fs.statSync(avifPath);
    console.log(`  -> ${baseName}-${width}.webp: ${(webpStat.size / 1024).toFixed(1)} KB`);
    console.log(`  -> ${baseName}-${width}.avif: ${(avifStat.size / 1024).toFixed(1)} KB`);
  }
}

async function run() {
  if (!fs.existsSync(destinationsDir)) {
    console.log(`No destinations directory found at ${destinationsDir}.`);
    return;
  }

  const slugs = fs.readdirSync(destinationsDir);
  let count = 0;

  for (const slug of slugs) {
    const slugPath = path.join(destinationsDir, slug);
    if (!fs.statSync(slugPath).isDirectory()) continue;

    const files = fs.readdirSync(slugPath);
    for (const file of files) {
      const lower = file.toLowerCase();
      if (
        lower === "hero.jpg" ||
        lower === "hero.jpeg" ||
        lower === "card.jpg" ||
        lower === "card.jpeg"
      ) {
        await optimizeImage(path.join(slugPath, file));
        count++;
      }
    }
  }

  if (count === 0) {
    console.log("No hero.jpg or card.jpg originals found to optimize.");
    console.log("Add photos according to IMAGES_NEEDED.md, then run `npm run images:optimize` again.");
  } else {
    console.log(`Optimization complete for ${count} source images.`);
  }
}

run().catch((err) => {
  console.error("Image optimization error:", err);
  process.exit(1);
});

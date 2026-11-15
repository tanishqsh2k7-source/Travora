import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const destinationsDir = path.join(publicDir, "images/destinations");
const destinationsTsPath = path.resolve(__dirname, "../src/content/destinations.ts");

const REQUIRED_SLUGS = [
  "lisbon",
  "tokyo",
  "paris",
  "udaipur",
  "jodhpur",
  "destination-6",
  "destination-7",
  "destination-8",
];

const MAX_FILE_SIZE_BYTES = 400 * 1024; // 400 KB

async function check() {
  console.log("==========================================");
  console.log("   Travora Destination Images Audit Check  ");
  console.log("==========================================\n");

  const errors = [];
  const missingFiles = [];

  // 1. Verify content file exists and check metadata
  if (!fs.existsSync(destinationsTsPath)) {
    errors.push(`Missing content file: ${destinationsTsPath}`);
  } else {
    const content = fs.readFileSync(destinationsTsPath, "utf-8");
    for (const slug of REQUIRED_SLUGS) {
      if (!content.includes(`slug: "${slug}"`)) {
        errors.push(`Destination content missing entry for slug: "${slug}"`);
      }
    }
  }

  // 2. Check presence and resolution of image assets
  for (const slug of REQUIRED_SLUGS) {
    const slugDir = path.join(destinationsDir, slug);
    const heroJpg = path.join(slugDir, "hero.jpg");
    const heroJpeg = path.join(slugDir, "hero.jpeg");
    const heroPath = fs.existsSync(heroJpg) ? heroJpg : fs.existsSync(heroJpeg) ? heroJpeg : null;

    const cardJpg = path.join(slugDir, "card.jpg");
    const cardJpeg = path.join(slugDir, "card.jpeg");
    const cardPath = fs.existsSync(cardJpg) ? cardJpg : fs.existsSync(cardJpeg) ? cardJpeg : null;

    // Check Hero Image
    if (!heroPath) {
      missingFiles.push(`public/images/destinations/${slug}/hero.jpg (or .jpeg)`);
    } else {
      try {
        const meta = await sharp(heroPath).metadata();
        if ((meta.width ?? 0) < 2400) {
          errors.push(
            `Hero resolution too low for "${slug}": ${meta.width}px wide (minimum required: 2400px)`
          );
        }
      } catch (e) {
        errors.push(`Could not read hero image for "${slug}": ${e.message}`);
      }
    }

    // Check Card Image
    if (!cardPath) {
      missingFiles.push(`public/images/destinations/${slug}/card.jpg (or .jpeg)`);
    } else {
      try {
        const meta = await sharp(cardPath).metadata();
        if ((meta.width ?? 0) < 1200) {
          errors.push(
            `Card resolution too low for "${slug}": ${meta.width}px wide (minimum required: 1200px)`
          );
        }
      } catch (e) {
        errors.push(`Could not read card image for "${slug}": ${e.message}`);
      }
    }
  }

  // 3. Check optimized file sizes
  if (fs.existsSync(destinationsDir)) {
    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          scanDir(full);
        } else if (file.endsWith(".avif") || file.endsWith(".webp")) {
          const stat = fs.statSync(full);
          if (stat.size > MAX_FILE_SIZE_BYTES) {
            errors.push(
              `Optimized file exceeds 400 KB limit: ${path.relative(publicDir, full)} (${(
                stat.size / 1024
              ).toFixed(1)} KB)`
            );
          }
        }
      }
    }
    scanDir(destinationsDir);
  }

  // Summary
  if (missingFiles.length > 0) {
    console.warn(`[PENDING ASSETS] Missing ${missingFiles.length} original photos:`);
    missingFiles.forEach((f) => console.warn(`  - ${f}`));
    console.warn(`\n(The site will use graceful branded fallbacks until these are supplied.)`);
  }

  if (errors.length > 0) {
    console.error(`\n[FAILED CHECKS] ${errors.length} validation errors:`);
    errors.forEach((err) => console.error(`  ✕ ${err}`));
  }

  if (missingFiles.length > 0 || errors.length > 0) {
    console.log("\nSee IMAGES_NEEDED.md for exact specifications.");
    process.exit(1);
  }

  console.log("All image requirements PASSED! (All files present, correct resolutions, < 400 KB)");
}

check().catch((err) => {
  console.error("Check images failed with exception:", err);
  process.exit(1);
});

/**
 * QA Smoke — Phase 16: PWA / App-Gefühl
 *
 * Checks manifest, icons, metadata, and safe-area CSS.
 * All tests are file/content based — no browser, no network.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFile(rel: string): string | null {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf-8");
}

function fileExists(rel: string): boolean {
  return existsSync(join(ROOT, rel));
}

function readBinary(rel: string): Buffer | null {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return null;
  return readFileSync(abs);
}

// ── PNG integrity check ───────────────────────────────────────────────────────

function isPNG(buf: Buffer): boolean {
  return (
    buf.length > 8 &&
    buf[0] === 137 &&
    buf[1] === 80 &&
    buf[2] === 78 &&
    buf[3] === 71
  );
}

function pngDim(buf: Buffer): { w: number; h: number } {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

// ── Tests ────────────────────────────────────────────────────────────────────

section("1. Icon files");

const icon192 = readBinary("public/icons/icon-192.png");
const icon512 = readBinary("public/icons/icon-512.png");

ok("public/icons/icon-192.png exists", icon192 !== null);
if (icon192) {
  ok("icon-192.png is valid PNG (signature)", isPNG(icon192));
  ok("icon-192.png width = 192", pngDim(icon192).w === 192);
  ok("icon-192.png height = 192", pngDim(icon192).h === 192);
}

ok("public/icons/icon-512.png exists", icon512 !== null);
if (icon512) {
  ok("icon-512.png is valid PNG (signature)", isPNG(icon512));
  ok("icon-512.png width = 512", pngDim(icon512).w === 512);
  ok("icon-512.png height = 512", pngDim(icon512).h === 512);
}

if (icon192 && icon512) {
  ok("icon-512.png is larger than icon-192.png", icon512.length > icon192.length);
}

section("2. Manifest (src/app/manifest.ts)");

const manifestSrc = readFile("src/app/manifest.ts");
ok("src/app/manifest.ts exists", manifestSrc !== null);

if (manifestSrc) {
  [
    ["MetadataRoute", "imports MetadataRoute from next"],
    ["MUSKELKATER GMBH", "name = MUSKELKATER GMBH"],
    ["Muskelkater", "short_name = Muskelkater"],
    ["standalone", "display = standalone"],
    ["#0a0a0b", "background_color matches brand"],
    ["/heute", "start_url = /heute"],
    ["icon-192.png", "references 192px icon"],
    ["icon-512.png", "references 512px icon"],
    ["192x192", "declares 192x192 size"],
    ["512x512", "declares 512x512 size"],
    ["maskable", "512 icon has maskable purpose"],
  ].forEach(([needle, label]) => {
    ok(label, manifestSrc.includes(needle));
  });
}

section("3. Root layout — PWA metadata");

const layoutSrc = readFile("src/app/layout.tsx");
ok("src/app/layout.tsx readable", layoutSrc !== null);

if (layoutSrc) {
  [
    ["manifest.webmanifest", "manifest link in metadata"],
    ["appleWebApp", "appleWebApp metadata configured"],
    ["capable: true", "apple-mobile-web-app-capable = true"],
    ["statusBarStyle", "apple status bar style set"],
    ["Muskelkater", "apple title = Muskelkater"],
    ["icon-192.png", "icon-192 referenced in icons metadata"],
    ["icon-512.png", "icon-512 referenced in icons metadata"],
    ["apple", "apple touch icon configured"],
    ["viewportFit", "viewportFit in Viewport export"],
    ["cover", "viewportFit = cover"],
    ["themeColor", "themeColor in Viewport export"],
    ["#0a0a0b", "themeColor matches brand dark"],
  ].forEach(([needle, label]) => {
    ok(label, layoutSrc.includes(needle));
  });
}

section("4. App layout — safe-area bottom padding");

const appLayoutSrc = readFile("src/app/(app)/layout.tsx");
ok("src/app/(app)/layout.tsx readable", appLayoutSrc !== null);

if (appLayoutSrc) {
  ok("main uses pb-safe-tabbar utility class", appLayoutSrc.includes("pb-safe-tabbar"));
  ok("desktop override md:pb-12 present", appLayoutSrc.includes("md:pb-12"));
  ok("legacy pb-28 replaced", !appLayoutSrc.includes("pb-28"));
}

section("5. Global CSS — safe-area utility");

const globalsCss = readFile("src/app/globals.css");
ok("src/app/globals.css readable", globalsCss !== null);

if (globalsCss) {
  [
    ["pb-safe-tabbar", "@utility pb-safe-tabbar defined"],
    ["env(safe-area-inset-bottom)", "uses CSS env() safe-area-inset-bottom"],
    ["calc(7rem", "calc includes base tabbar height (7rem)"],
    ["@utility", "uses Tailwind v4 @utility directive"],
  ].forEach(([needle, label]) => {
    ok(label, globalsCss.includes(needle));
  });
}

section("6. Mobile tabbar — existing safe-area");

const tabbarSrc = readFile("src/components/navigation/mobile-tabbar.tsx");
ok("mobile-tabbar.tsx readable", tabbarSrc !== null);

if (tabbarSrc) {
  ok(
    "tabbar already has safe-area-inset-bottom extension",
    tabbarSrc.includes("safe-area-inset-bottom"),
  );
}

section("7. Generation script");

ok("scripts/generate-pwa-icons.ts exists", fileExists("scripts/generate-pwa-icons.ts"));

const genSrc = readFile("scripts/generate-pwa-icons.ts");
if (genSrc) {
  [
    ["deflateSync", "uses zlib deflateSync (no external deps)"],
    ["CRC_TABLE", "CRC32 table for PNG integrity"],
    ["pngChunk", "PNG chunk builder"],
    ["generateIcon", "generateIcon function"],
    ["192", "generates 192px icon"],
    ["512", "generates 512px icon"],
    ["bgR = 0x14", "background color #141518"],
    ["fgR = 0xe0", "accent color #e0223a"],
  ].forEach(([needle, label]) => {
    ok(label, genSrc.includes(needle));
  });
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`Phase 16 PWA — ${passed + failed} tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

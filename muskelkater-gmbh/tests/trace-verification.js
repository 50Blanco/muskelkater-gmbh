/**
 * Muskelkater GmbH — Static Code-Trace Verification
 *
 * Method: No browser launched. The script reads index.html, extracts
 * every relevant code block, and asserts expected strings / logic.
 * Each console line is prefixed PASS | FAIL | WARN.
 *
 * Run:  node tests/trace-verification.js
 *       (from the project root, or adjust the path below)
 */

const fs   = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "index.html");
const html     = fs.readFileSync(htmlPath, { encoding: "utf8" });

let passed = 0, failed = 0, warned = 0;

function assert(label, cond, note) {
  if (cond) {
    console.log(`PASS | ${label}`);
    passed++;
  } else {
    console.log(`FAIL | ${label}${note ? " — " + note : ""}`);
    failed++;
  }
}

function warn(label, cond, note) {
  if (cond) {
    console.log(`PASS | ${label}`);
    passed++;
  } else {
    console.log(`WARN | ${label}${note ? " — " + note : ""}`);
    warned++;
  }
}

// Helper: extract the source block between a start token and the first '}' or '});'
function slice(startToken, endToken = "});") {
  const s = html.indexOf(startToken);
  if (s === -1) return "";
  const e = html.indexOf(endToken, s);
  return e === -1 ? "" : html.substring(s, e + endToken.length);
}

// -----------------------------------------------------------------------
console.log("\n===== TEST 1 — Intro splash appears, no auto-dismiss =====");
// -----------------------------------------------------------------------
assert("1a intro div present",       html.includes('<div class="intro" id="intro">'));
assert("1b logo <img> present",       html.includes('<img class="logo" src="assets/logos/logo.png"'));
assert("1c 'Willkommen bei' text",    html.includes("Willkommen bei"));
assert("1d Macher button",            html.includes('id="macherBtn">Bist du Macher?'));
assert("1e Schlafer button",          html.includes('id="schlaeferBtn">Oder Schl'));
// No auto-dismiss: the only setTimeout(appBereit) must be exactly 1 and inside macherBtn handler
const timeoutCount = (html.match(/setTimeout\s*\(\s*appBereit/g) || []).length;
assert("1f exactly 1 setTimeout(appBereit) total", timeoutCount === 1,
       `found ${timeoutCount}`);
assert("1g no setInterval auto-dismiss",
       !/setInterval[\s\S]{0,50}appBereit/.test(html));
// That single timeout lives inside the macherBtn click handler
const macherBlock = slice("macherBtn.addEventListener");
assert("1h setTimeout inside macherBtn handler only",
       macherBlock.includes("setTimeout(appBereit, 500)"));

// -----------------------------------------------------------------------
console.log("\n===== TEST 2 — Schlafer keeps splash, shows message =====");
// -----------------------------------------------------------------------
assert("2a message exact text",
       html.includes("Ewa dann geh schlafen, hier hast du nichts verloren."));
const schlaeferBlock = slice("schlaeferBtn.addEventListener");
assert("2b Schlafer handler does NOT call appBereit",
       !schlaeferBlock.includes("appBereit"));
assert("2c Schlafer handler does NOT call intro.remove",
       !schlaeferBlock.includes("intro.remove"));
assert("2d Schlafer adds .sichtbar class (message revealed)",
       schlaeferBlock.includes("sichtbar"));

// -----------------------------------------------------------------------
console.log("\n===== TEST 3 — Macher fades splash, reveals app + weiter =====");
// -----------------------------------------------------------------------
assert("3a Macher adds .weg class (CSS fade-out)",
       macherBlock.includes('intro.classList.add("weg")'));
assert("3b Macher calls setTimeout(appBereit, 500)",
       macherBlock.includes("setTimeout(appBereit, 500)"));
const appBereitBlock = slice("function appBereit", "}");
assert("3c appBereit removes intro from DOM",
       appBereitBlock.includes("intro.remove()"));
assert("3d appBereit adds .aktiv to weiterBtn",
       appBereitBlock.includes('weiterBtn.classList.add("aktiv")'));
assert("3e weiter-btn starts opacity:0 (invisible)",
       html.includes("opacity: 0;"));
assert("3f weiter-btn starts pointer-events:none (non-clickable)",
       html.includes("pointer-events: none;"));

// -----------------------------------------------------------------------
console.log("\n===== TEST 4 — Arrow steppers (±1 / ±30 / ±100, floor 0) =====");
// -----------------------------------------------------------------------
const arrows = html.match(/data-ziel="(\w+)"\s+data-schritt="(-?\d+)"/g) || [];
assert("4a workouts +1 arrow",  arrows.some(a => a.includes('workouts') && a.includes('"1"')));
assert("4b workouts -1 arrow",  arrows.some(a => a.includes('workouts') && a.includes('"-1"')));
assert("4c minuten +30 arrow",  arrows.some(a => a.includes('minuten')  && a.includes('"30"')));
assert("4d minuten -30 arrow",  arrows.some(a => a.includes('minuten')  && a.includes('"-30"')));
assert("4e kalorien +100 arrow",arrows.some(a => a.includes('kalorien') && a.includes('"100"')));
assert("4f kalorien -100 arrow",arrows.some(a => a.includes('kalorien') && a.includes('"-100"')));
assert("4g Math.max(0,...) prevents sub-zero",
       html.includes("Math.max(0, aktuell + schritt)"));

// -----------------------------------------------------------------------
console.log("\n===== TEST 5 — weiter saves entry, resets steppers, updates dashboard =====");
// -----------------------------------------------------------------------
const weiterBlock = slice("weiterBtn.addEventListener", "    });");
assert("5a saves entry with datum:Date.now()",
       weiterBlock.includes("datum: Date.now()"));
assert("5b calls speichern() to persist",
       weiterBlock.includes("speichern()"));
assert("5c calls zeichneVerlauf() to refresh list",
       weiterBlock.includes("zeichneVerlauf()"));
assert("5d resets workouts to 0",  weiterBlock.includes("elWorkouts.textContent = 0"));
assert("5e resets minuten to 0",   weiterBlock.includes("elMinuten.textContent  = 0"));
assert("5f resets kalorien to 0",  weiterBlock.includes("elKalorien.textContent = 0"));
const uebBlock = slice("function aktualisiereUebersicht", "\n    }");
assert("5g zeichneVerlauf -> aktualisiereUebersicht",
       html.includes("aktualisiereUebersicht()"));
assert("5h updates heute counter",  uebBlock.includes("elHeute.textContent"));
assert("5i updates woche counter",  uebBlock.includes("elWoche.textContent"));
assert("5j updates zielText",       uebBlock.includes("elZielText.textContent"));
assert("5k updates progress bar width",
       uebBlock.includes("elZielBalken.style.width"));

// -----------------------------------------------------------------------
console.log("\n===== TEST 6 — weiter with all-zero shows guard hint =====");
// -----------------------------------------------------------------------
assert("6a zero-guard check",
       weiterBlock.includes("workouts === 0 && minuten === 0 && kalorien === 0"));
assert("6b guard shows hint text",
       weiterBlock.includes("Stell erst Werte mit den Pfeilen ein"));
// Guard uses early return so nothing is pushed
assert("6c guard uses early return (no push when zero)",
       weiterBlock.indexOf("return") < weiterBlock.indexOf("trainings.push"));

// -----------------------------------------------------------------------
console.log("\n===== TEST 7 — Weekly goal reward fires on transition only =====");
// -----------------------------------------------------------------------
assert("7a .voll class toggled on bar", uebBlock.includes('classList.toggle("voll", erreicht)'));
assert("7b feiere() called in uebersicht", uebBlock.includes("feiere()"));
assert("7c reward needs !ersterDurchlauf (no fire on page load)",
       uebBlock.includes("!ersterDurchlauf"));
assert("7d reward needs !zielWarErreicht (no double fire)",
       uebBlock.includes("!zielWarErreicht"));
assert("7e ersterDurchlauf starts true",   html.includes("let ersterDurchlauf = true"));
assert("7f ersterDurchlauf set false after first run",
       uebBlock.includes("ersterDurchlauf = false"));
assert("7g zielWarErreicht updated each call", uebBlock.includes("zielWarErreicht = erreicht"));
const feierBlock = slice("function feiere", "\n    }");
assert("7h feiere sets reward message",   feierBlock.includes("Wochenziel erreicht"));
assert("7i feiere skips confetti on prefers-reduced-motion",
       feierBlock.includes("prefers-reduced-motion: reduce"));
assert("7j feiere creates 44 confetti pieces", feierBlock.includes("i < 44"));
assert("7k @keyframes konfettiBurst defined", html.includes("@keyframes konfettiBurst"));
assert("7l @keyframes zielPuls defined",      html.includes("@keyframes zielPuls"));

// -----------------------------------------------------------------------
console.log("\n===== TEST 8 — Per-entry delete + clear-all =====");
// -----------------------------------------------------------------------
const loescheBlock = slice("function loescheTraining", "\n    }");
assert("8a loescheTraining uses splice(index,1)",
       loescheBlock.includes("trainings.splice(index, 1)"));
assert("8b loescheTraining calls speichern",   loescheBlock.includes("speichern()"));
assert("8c loescheTraining calls zeichneVerlauf", loescheBlock.includes("zeichneVerlauf()"));
assert("8d per-entry del button has aria-label",
       html.includes("Diesen Eintrag l"));
const lbBlock = slice('document.getElementById("loeschenBtn")');
assert("8e clear-all uses confirm() dialog", lbBlock.includes("confirm("));
assert("8f clear-all sets trainings = []",   lbBlock.includes("trainings = []"));
assert("8g clear-all calls speichern",        lbBlock.includes("speichern()"));
assert("8h clear-all calls zeichneVerlauf",   lbBlock.includes("zeichneVerlauf()"));

// -----------------------------------------------------------------------
console.log("\n===== TEST 9 — Persistence via localStorage =====");
// -----------------------------------------------------------------------
assert("9a storage key defined",
       html.includes('SPEICHER_SCHLUESSEL = "muskelkater_trainings"'));
assert("9b loads from localStorage on init",
       html.includes("JSON.parse(localStorage.getItem(SPEICHER_SCHLUESSEL) || \"[]\")"));
assert("9c speichern() writes JSON to localStorage",
       html.includes("localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(trainings))"));
assert("9d zeichneVerlauf() called on page load (hydrates UI)",
       html.includes("zeichneVerlauf();"));

// -----------------------------------------------------------------------
console.log("\n===== TEST 10 — Accessibility =====");
// -----------------------------------------------------------------------
assert("10a workouts-up arrow has aria-label",   html.includes('aria-label="Workouts erh'));
assert("10b workouts-down arrow has aria-label", html.includes('aria-label="Workouts verringern"'));
assert("10c minuten-up arrow has aria-label",    html.includes('aria-label="Minuten erh'));
assert("10d minuten-down arrow has aria-label",  html.includes('aria-label="Minuten verringern"'));
assert("10e kalorien-up arrow has aria-label",   html.includes('aria-label="Kalorien erh'));
assert("10f kalorien-down arrow has aria-label", html.includes('aria-label="Kalorien verringern"'));
assert("10g weiter btn has aria-label",
       html.includes('aria-label="Training speichern"'));
assert("10h Macher is a real <button>",
       html.includes('<button type="button" class="frage frage-links" id="macherBtn">'));
assert("10i Schlafer is a real <button>",
       html.includes('<button type="button" class="frage frage-rechts" id="schlaeferBtn">'));
assert("10j .frage:focus-visible style present",   html.includes(".frage:focus-visible"));
// Extract the full @media block by counting brace depth (lazy regex stops at first })
function extractMediaBlock(src, startToken) {
  const s = src.indexOf(startToken);
  if (s === -1) return "";
  let depth = 0, pos = s;
  while (pos < src.length) {
    if (src[pos] === "{") depth++;
    if (src[pos] === "}") { depth--; if (depth === 0) return src.substring(s, pos + 1); }
    pos++;
  }
  return "";
}
const rmBlock = extractMediaBlock(html, "@media (prefers-reduced-motion: reduce)");
assert("10k prefers-reduced-motion media query",  rmBlock.length > 0);
assert("10l reduced-motion disables splash animations", rmBlock.includes("animation: none"));
assert("10m .frage opacity:1 in reduced-motion (splash still usable)",
       rmBlock.includes("opacity: 1"));
assert("10n feiere() checks matchMedia for confetti skip",
       html.includes('window.matchMedia("(prefers-reduced-motion: reduce)")'));

// -----------------------------------------------------------------------
console.log(`\n========================================`);
console.log(`Results: ${passed} PASS  |  ${failed} FAIL  |  ${warned} WARN`);
console.log(`Total checks: ${passed + failed + warned}`);
console.log(`========================================\n`);
process.exit(failed > 0 ? 1 : 0);

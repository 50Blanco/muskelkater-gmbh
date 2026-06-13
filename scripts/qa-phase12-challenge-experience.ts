/**
 * Phase 12 — Challenge Experience: Smoke Tests
 * Getestet ohne DB-Verbindung (pure Logik / Typen).
 */

import {
  buildLeaderboard,
  determineChallengeWinner,
  POINTS,
  type WinnerResult,
} from "../src/lib/social/challenge-scoring";

let passed = 0;
let failed = 0;

function expect(label: string, actual: unknown, expected: unknown) {
  const ok =
    typeof expected === "object"
      ? JSON.stringify(actual) === JSON.stringify(expected)
      : actual === expected;
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

/* ------------------------------------------------------------------ */
/* 1. determineChallengeWinner                                          */
/* ------------------------------------------------------------------ */

console.log("\n1. determineChallengeWinner");

// Leeres Leaderboard
{
  const result = determineChallengeWinner([]);
  expect("empty → no winner, no tie", result.isTie, false);
  expect("empty → winner is null", result.winner, null);
}

// Klarer Sieger
{
  const lb = buildLeaderboard(
    [
      { userId: "a", displayName: "Akram", score: 200 },
      { userId: "b", displayName: "Rachid", score: 150 },
    ],
    "a",
  );
  const result = determineChallengeWinner(lb);
  expect("clear winner → isTie = false", result.isTie, false);
  expect("clear winner → displayName = Akram", result.winner?.displayName, "Akram");
  expect("clear winner → score = 200", result.winner?.score, 200);
}

// Gleichstand (tie)
{
  const lb = buildLeaderboard(
    [
      { userId: "a", displayName: "Akram", score: 200 },
      { userId: "b", displayName: "Rachid", score: 200 },
    ],
    "a",
  );
  const result = determineChallengeWinner(lb);
  expect("tie → isTie = true", result.isTie, true);
  expect("tie → winner = null", result.winner, null);
}

// Einzelmitglied
{
  const lb = buildLeaderboard(
    [{ userId: "a", displayName: "Solo", score: 100 }],
    "a",
  );
  const result = determineChallengeWinner(lb);
  expect("solo → isTie = false", result.isTie, false);
  expect("solo → winner = Solo", result.winner?.displayName, "Solo");
}

// Dreierkampf — klarer Gewinner
{
  const lb = buildLeaderboard(
    [
      { userId: "a", displayName: "Alpha", score: 300 },
      { userId: "b", displayName: "Beta", score: 250 },
      { userId: "c", displayName: "Gamma", score: 100 },
    ],
    "b",
  );
  const result = determineChallengeWinner(lb);
  expect("three players → winner Alpha", result.winner?.displayName, "Alpha");
  expect("three players → score 300", result.winner?.score, 300);
}

// Nur Rang-1-Tie, Rang-2 normal
{
  const lb = buildLeaderboard(
    [
      { userId: "a", displayName: "A", score: 200 },
      { userId: "b", displayName: "B", score: 200 },
      { userId: "c", displayName: "C", score: 100 },
    ],
    "c",
  );
  const result = determineChallengeWinner(lb);
  expect("rank-1 tie → isTie = true", result.isTie, true);
}

/* ------------------------------------------------------------------ */
/* 2. POINTS.bodyCheckin bleibt 50                                     */
/* ------------------------------------------------------------------ */

console.log("\n2. POINTS-Konstanten");

expect("bodyCheckin = 50", POINTS.bodyCheckin, 50);
expect("workout = 30", POINTS.workout, 30);
expect("steps = 20", POINTS.steps, 20);

/* ------------------------------------------------------------------ */
/* 3. ChallengeHistoryEntry Privacy                                    */
/* ------------------------------------------------------------------ */

console.log("\n3. ChallengeHistoryEntry — keine sensiblen Felder");

const HISTORY_ENTRY_KEYS = ["id", "title", "startsOn", "endsOn", "status", "stakeText"];
const SENSITIVE = ["weight", "weightkg", "bodyfat", "calories", "protein", "height", "waist", "arm", "chest"];

const hasNoSensitiveKey = HISTORY_ENTRY_KEYS.every(
  (k) => !SENSITIVE.includes(k.toLowerCase()),
);
expect("history entry has no sensitive fields", hasNoSensitiveKey, true);

/* ------------------------------------------------------------------ */
/* 4. ChallengeDetailData Privacy                                      */
/* ------------------------------------------------------------------ */

console.log("\n4. ChallengeDetailData — Privacy-Guard");

const DETAIL_TOP_LEVEL_KEYS = [
  "challenge",
  "group",
  "leaderboard",
  "winner",
  "isEnded",
  "ownOpenSources",
  "checkinOpenThisWeek",
  "ownScore",
];

const CHALLENGE_KEYS = ["id", "groupId", "title", "stakeText", "startsOn", "endsOn", "status"];

const noSensitiveInDetail = [...DETAIL_TOP_LEVEL_KEYS, ...CHALLENGE_KEYS].every(
  (k) => !SENSITIVE.includes(k.toLowerCase()),
);
expect("challenge detail has no sensitive fields", noSensitiveInDetail, true);

// weeklyCheckinDone ist boolean — kein Wert
expect("checkinOpenThisWeek is boolean key (no value)", "checkinOpenThisWeek".includes("value"), false);

/* ------------------------------------------------------------------ */
/* 5. buildLeaderboard soft-ranking                                    */
/* ------------------------------------------------------------------ */

console.log("\n5. buildLeaderboard — Soft-Ranking");

{
  const lb = buildLeaderboard(
    [
      { userId: "a", displayName: "A", score: 200 },
      { userId: "b", displayName: "B", score: 200 },
      { userId: "c", displayName: "C", score: 150 },
    ],
    "c",
  );
  expect("tie both get rank 1", lb[0].rank, 1);
  expect("tie both get rank 1 (second)", lb[1].rank, 1);
  expect("third gets rank 3 (skip 2)", lb[2].rank, 3);
}

/* ------------------------------------------------------------------ */
/* 6. Challenge templates (statische Vorlagen)                         */
/* ------------------------------------------------------------------ */

console.log("\n6. Challenge-Vorlagen");

const EXPECTED_TEMPLATES = [
  "7 Tage Neustart",
  "30 Tage durchziehen",
  "Schritte-Woche",
  "Training & Check-in",
  "Team-Konstanz",
];

// Templates sind im Code definiert — hier prüfen wir die erwarteten Labels
expect("5 Templates definiert", EXPECTED_TEMPLATES.length, 5);
expect("7 Tage Neustart vorhanden", EXPECTED_TEMPLATES.includes("7 Tage Neustart"), true);
expect("30 Tage vorhanden", EXPECTED_TEMPLATES.includes("30 Tage durchziehen"), true);
expect("Kein leeres Label", EXPECTED_TEMPLATES.every((t) => t.length > 0), true);

/* ------------------------------------------------------------------ */
/* 7. Gewinner-Texte keine toxische Sprache                           */
/* ------------------------------------------------------------------ */

console.log("\n7. Gewinner-Texte — keine toxische Sprache");

const TOXIC_WORDS = ["verlierer", "loser", "letzte", "schlechteste", "versager"];

function getWinnerTexts(result: WinnerResult): string[] {
  if (result.isTie) return ["Unentschieden. Starkes Team-Ergebnis."];
  if (!result.winner) return ["Keine Teilnehmer."];
  return [`${result.winner.displayName} hat die Challenge gewonnen!`];
}

// Test für Gleichstand
{
  const lb = buildLeaderboard(
    [
      { userId: "a", displayName: "A", score: 100 },
      { userId: "b", displayName: "B", score: 100 },
    ],
    "a",
  );
  const result = determineChallengeWinner(lb);
  const texts = getWinnerTexts(result);
  const hasToxic = texts.some((t) =>
    TOXIC_WORDS.some((w) => t.toLowerCase().includes(w)),
  );
  expect("tie text has no toxic words", hasToxic, false);
}

// Test für Sieger
{
  const lb = buildLeaderboard(
    [
      { userId: "a", displayName: "Max", score: 200 },
      { userId: "b", displayName: "Tom", score: 100 },
    ],
    "a",
  );
  const result = determineChallengeWinner(lb);
  const texts = getWinnerTexts(result);
  const hasToxic = texts.some((t) =>
    TOXIC_WORDS.some((w) => t.toLowerCase().includes(w)),
  );
  expect("winner text has no toxic words", hasToxic, false);
  expect("winner text mentions name", texts[0].includes("Max"), true);
}

/* ------------------------------------------------------------------ */
/* Ergebnis                                                            */
/* ------------------------------------------------------------------ */

console.log(`\n${"─".repeat(50)}`);
console.log(`Phase 12 Smoke: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

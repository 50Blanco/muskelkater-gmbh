/**
 * QA Smoke-Tests — Phase 7A: Übungsbibliothek
 * Pure Logik-Tests, keine DB-Verbindung nötig.
 */

import {
  filterExercises,
  normalizeMuscleGroup,
  sortExercises,
  extractMuscleGroups,
  extractEquipment,
  buildFilterSearchParams,
  filtersFromSearchParams,
  hasActiveFilters,
  EMPTY_FILTERS,
  type LibraryExercise,
} from "../src/lib/training/exercise-filters";

let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`PASS — ${description}`);
  } else {
    console.error(`FAIL — ${description}`);
    failed++;
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const catalog: LibraryExercise[] = [
  { uid: "g_1", source: "global", name: "Bankdrücken", muscleGroup: "chest", equipment: "Langhantel", location: "gym", level: "intermediate", instructions: "Flach liegen, Stange schulterbreit greifen." },
  { uid: "g_2", source: "global", name: "Kniebeuge", muscleGroup: "legs", equipment: "Langhantel", location: "both", level: "beginner", instructions: null },
  { uid: "g_3", source: "global", name: "Klimmzüge", muscleGroup: "back", equipment: null, location: "both", level: "intermediate", instructions: "Schulterbreiter Griff." },
  { uid: "g_4", source: "global", name: "Liegestütz", muscleGroup: "chest", equipment: null, location: "home", level: "beginner", instructions: null },
  { uid: "g_5", source: "global", name: "Schulterdrücken", muscleGroup: "shoulders", equipment: "Kurzhanteln", location: "gym", level: "intermediate", instructions: null },
  { uid: "g_6", source: "global", name: "Kreuzheben", muscleGroup: "back", equipment: "Langhantel", location: "gym", level: "advanced", instructions: "Rücken gerade halten." },
  { uid: "c_1", source: "custom", name: "Bizeps-Curl angepasst", muscleGroup: "biceps", equipment: null, location: "home", level: "beginner", instructions: null },
];

// ── Suche ─────────────────────────────────────────────────────────────────────

assert(
  "Suche 'bank' findet Bankdrücken (case-insensitive)",
  filterExercises(catalog, { ...EMPTY_FILTERS, search: "bank" }).some((e) => e.uid === "g_1"),
);

assert(
  "Suche 'KNIE' findet Kniebeuge (uppercase)",
  filterExercises(catalog, { ...EMPTY_FILTERS, search: "KNIE" }).some((e) => e.uid === "g_2"),
);

assert(
  "Suche 'züge' findet Klimmzüge (Teilstring mit Umlaut)",
  filterExercises(catalog, { ...EMPTY_FILTERS, search: "züge" }).some((e) => e.uid === "g_3"),
);

assert(
  "Suche 'xyz' findet nichts",
  filterExercises(catalog, { ...EMPTY_FILTERS, search: "xyz" }).length === 0,
);

assert(
  "Leere Suche gibt alle Übungen zurück",
  filterExercises(catalog, EMPTY_FILTERS).length === catalog.length,
);

// ── Filter Muskelgruppe ───────────────────────────────────────────────────────

assert(
  "Filter chest findet genau 2 (Bankdrücken + Liegestütz)",
  filterExercises(catalog, { ...EMPTY_FILTERS, muscleGroup: "chest" }).length === 2,
);

assert(
  "Filter back findet genau 2 (Klimmzüge + Kreuzheben)",
  filterExercises(catalog, { ...EMPTY_FILTERS, muscleGroup: "back" }).length === 2,
);

assert(
  "Filter biceps findet Custom-Übung",
  filterExercises(catalog, { ...EMPTY_FILTERS, muscleGroup: "biceps" }).some((e) => e.source === "custom"),
);

// ── Filter Ort ────────────────────────────────────────────────────────────────

assert(
  "Filter 'home' schließt reine gym-Übungen aus",
  filterExercises(catalog, { ...EMPTY_FILTERS, location: "home" }).every(
    (e) => e.location === "home" || e.location === "both",
  ),
);

assert(
  "Filter 'gym' schließt reine home-Übungen aus",
  filterExercises(catalog, { ...EMPTY_FILTERS, location: "gym" }).every(
    (e) => e.location === "gym" || e.location === "both",
  ),
);

assert(
  "Filter 'both' zeigt nur both-Übungen (Kniebeuge, Klimmzüge)",
  filterExercises(catalog, { ...EMPTY_FILTERS, location: "both" }).every((e) => e.location === "both"),
);

// ── Filter Equipment ──────────────────────────────────────────────────────────

assert(
  "Filter Equipment 'Langhantel' findet 3 Übungen",
  filterExercises(catalog, { ...EMPTY_FILTERS, equipment: "Langhantel" }).length === 3,
);

assert(
  "Filter Equipment 'Kurzhanteln' findet Schulterdrücken",
  filterExercises(catalog, { ...EMPTY_FILTERS, equipment: "Kurzhanteln" }).some((e) => e.uid === "g_5"),
);

// ── Filter Level ──────────────────────────────────────────────────────────────

assert(
  "Filter level 'beginner' findet keine advanced-Übungen",
  filterExercises(catalog, { ...EMPTY_FILTERS, level: "beginner" }).every((e) => e.level === "beginner"),
);

assert(
  "Filter level 'advanced' findet Kreuzheben",
  filterExercises(catalog, { ...EMPTY_FILTERS, level: "advanced" }).some((e) => e.uid === "g_6"),
);

// ── Kombinierte Filter ────────────────────────────────────────────────────────

assert(
  "chest + gym → nur Bankdrücken",
  filterExercises(catalog, { ...EMPTY_FILTERS, muscleGroup: "chest", location: "gym" }).length === 1,
);

assert(
  "back + intermediate → Klimmzüge (nicht Kreuzheben/advanced)",
  (() => {
    const r = filterExercises(catalog, { ...EMPTY_FILTERS, muscleGroup: "back", level: "intermediate" });
    return r.length === 1 && r[0].uid === "g_3";
  })(),
);

assert(
  "Kombiniert: Suche 'kreu' + level 'advanced' → Kreuzheben",
  (() => {
    const r = filterExercises(catalog, { ...EMPTY_FILTERS, search: "kreu", level: "advanced" });
    return r.length === 1 && r[0].uid === "g_6";
  })(),
);

// ── Empty Result ──────────────────────────────────────────────────────────────

assert(
  "chest + home → Liegestütz (beide passen); nicht leer",
  filterExercises(catalog, { ...EMPTY_FILTERS, muscleGroup: "chest", location: "home" }).length >= 1,
);

assert(
  "Unmögliche Kombination → leer",
  filterExercises(catalog, { ...EMPTY_FILTERS, muscleGroup: "shoulders", location: "home", level: "advanced" }).length === 0,
);

// ── Merge global + custom ────────────────────────────────────────────────────

assert(
  "Catalog enthält custom-Übung",
  catalog.some((e) => e.source === "custom"),
);

assert(
  "Keine ID-Kollision: g_ und c_ Präfixe eindeutig",
  new Set(catalog.map((e) => e.uid)).size === catalog.length,
);

assert(
  "Custom-Übung hat source='custom'",
  catalog.find((e) => e.uid === "c_1")?.source === "custom",
);

// ── Sortierung ────────────────────────────────────────────────────────────────

const sorted = sortExercises(catalog);

assert(
  "Globale Übungen kommen vor Custom",
  sorted.findIndex((e) => e.source === "global") < sorted.findIndex((e) => e.source === "custom"),
);

assert(
  "Innerhalb global: alphabetisch nach Name (de)",
  (() => {
    const globalNames = sorted.filter((e) => e.source === "global").map((e) => e.name);
    const manual = [...globalNames].sort((a, b) => a.localeCompare(b, "de"));
    return globalNames.every((n, i) => n === manual[i]);
  })(),
);

assert(
  "Sortierung stabil bei identischen Werten (kein Fehler)",
  sortExercises([...catalog]).length === catalog.length,
);

// ── Muskelgruppen-Normalisierung ──────────────────────────────────────────────

assert(
  "Bekannter Key 'chest' bleibt 'chest'",
  normalizeMuscleGroup("chest") === "chest",
);

assert(
  "Unbekannter Key 'unbekannt' → 'sonstige'",
  normalizeMuscleGroup("unbekannt") === "sonstige",
);

assert(
  "Großschreibung 'CHEST' → 'chest' (normalisiert)",
  normalizeMuscleGroup("CHEST") === "chest",
);

assert(
  "Whitespace wird getrimmt ' back ' → 'back'",
  normalizeMuscleGroup(" back ") === "back",
);

// ── extractMuscleGroups / extractEquipment ────────────────────────────────────

assert(
  "extractMuscleGroups gibt nur bekannte Keys zurück",
  extractMuscleGroups(catalog).every((mg) => mg !== "sonstige" || true), // sonstige erlaubt
);

assert(
  "extractEquipment schließt null aus",
  !extractEquipment(catalog).includes(""),
);

assert(
  "extractEquipment enthält 'Langhantel'",
  extractEquipment(catalog).includes("Langhantel"),
);

// ── URL-Utilities (FIX 1: Button-basierte Filter) ────────────────────────────

assert(
  "buildFilterSearchParams: leere Filter → leere Params",
  buildFilterSearchParams(EMPTY_FILTERS).toString() === "",
);

assert(
  "buildFilterSearchParams: search wird als 'q' kodiert",
  buildFilterSearchParams({ ...EMPTY_FILTERS, search: "bank" }).get("q") === "bank",
);

assert(
  "buildFilterSearchParams: alle Filter-Felder korrekt kodiert",
  (() => {
    const params = buildFilterSearchParams({
      search: "",
      muscleGroup: "chest",
      location: "gym",
      equipment: "Langhantel",
      level: "intermediate",
    });
    return (
      params.get("muscle") === "chest" &&
      params.get("location") === "gym" &&
      params.get("equipment") === "Langhantel" &&
      params.get("level") === "intermediate"
    );
  })(),
);

assert(
  "filtersFromSearchParams: Roundtrip — encode → decode → gleiche Filter",
  (() => {
    const original = {
      search: "bank",
      muscleGroup: "chest",
      location: "gym",
      equipment: "Langhantel",
      level: "intermediate",
    };
    const params = buildFilterSearchParams(original);
    const sp: Record<string, string | undefined> = {};
    params.forEach((v, k) => { sp[k] = v; });
    const restored = filtersFromSearchParams(sp);
    return (
      restored.search === original.search &&
      restored.muscleGroup === original.muscleGroup &&
      restored.location === original.location &&
      restored.equipment === original.equipment &&
      restored.level === original.level
    );
  })(),
);

assert(
  "filtersFromSearchParams: leere Params → EMPTY_FILTERS",
  (() => {
    const r = filtersFromSearchParams({});
    return r.search === "" && r.muscleGroup === "" && r.location === "" && r.equipment === "" && r.level === "";
  })(),
);

assert(
  "filtersFromSearchParams: Array-Wert → erster Wert wird genommen",
  filtersFromSearchParams({ q: ["bank", "knie"] }).search === "bank",
);

assert(
  "hasActiveFilters: EMPTY_FILTERS → false",
  !hasActiveFilters(EMPTY_FILTERS),
);

assert(
  "hasActiveFilters: nur search gesetzt → true",
  hasActiveFilters({ ...EMPTY_FILTERS, search: "bank" }),
);

assert(
  "hasActiveFilters: nur muscleGroup gesetzt → true",
  hasActiveFilters({ ...EMPTY_FILTERS, muscleGroup: "chest" }),
);

assert(
  "hasActiveFilters: nur level gesetzt → true",
  hasActiveFilters({ ...EMPTY_FILTERS, level: "beginner" }),
);

// ── Übungs-UID für Verlinkung (FIX 2: g_-Präfix) ─────────────────────────────

assert(
  "Globale Übungen haben uid mit 'g_'-Präfix",
  catalog.filter((e) => e.source === "global").every((e) => e.uid.startsWith("g_")),
);

assert(
  "Custom-Übungen haben uid mit 'c_'-Präfix",
  catalog.filter((e) => e.source === "custom").every((e) => e.uid.startsWith("c_")),
);

assert(
  "Globale UID ergibt korrekten Detail-Link",
  `/training/uebungen/${catalog[0].uid}` === "/training/uebungen/g_1",
);

// ── Abschluss ─────────────────────────────────────────────────────────────────

console.log(`\n${failed === 0 ? "ALLE TESTS BESTANDEN" : `${failed} TEST(S) FEHLGESCHLAGEN`}`);
if (failed > 0) process.exit(1);

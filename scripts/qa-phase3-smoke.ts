/**
 * QA-Smoke-Test für die puren Phase-3-Module:
 * Next-Workout-Auswahl (select-next-day) und das überarbeitete Safety-Modul
 * (symptoms.ts ohne ReDoS-Regex). Reine Logik, keine DB/React.
 *
 * Ausführen: npx tsx scripts/qa-phase3-smoke.ts
 */
import {
  selectNextDay,
  selectNextDayIndex,
} from "../src/lib/plan/select-next-day";
import { detectDangerSymptoms } from "../src/lib/safety/symptoms";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

/* --- Next-Workout: 3-Tage-Plan (Mo/Mi/Fr) --- */
// JS getDay(): 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
check("3-Tage: Montag → Tag 0", selectNextDayIndex(3, 1) === 0);
check("3-Tage: Mittwoch → Tag 1", selectNextDayIndex(3, 3) === 1);
check("3-Tage: Freitag → Tag 2", selectNextDayIndex(3, 5) === 2);
check("3-Tage: Dienstag → nächste Einheit (Tag 1)", selectNextDayIndex(3, 2) === 1);
check("3-Tage: Sonntag → neue Woche (Tag 0)", selectNextDayIndex(3, 0) === 0);

/* --- Next-Workout: 2-Tage-Plan (Mo/Do) --- */
check("2-Tage: Montag → Tag 0", selectNextDayIndex(2, 1) === 0);
check("2-Tage: Donnerstag → Tag 1", selectNextDayIndex(2, 4) === 1);
check("2-Tage: Samstag → neue Woche (Tag 0)", selectNextDayIndex(2, 6) === 0);

/* --- Index bleibt immer im gültigen Bereich --- */
let allInRange = true;
for (let dayCount = 2; dayCount <= 6; dayCount++) {
  for (let weekday = 0; weekday <= 6; weekday++) {
    const idx = selectNextDayIndex(dayCount, weekday);
    if (idx < 0 || idx >= dayCount || !Number.isInteger(idx)) allInRange = false;
  }
}
check("Index immer 0 ≤ idx < dayCount (alle 2–6 Tage × 7 Wochentage)", allInRange);

/* --- Fallbacks --- */
check("Fallback: 1-Tag-Plan → Tag 0", selectNextDayIndex(1, 3) === 0);
check("Fallback: 7-Tage-Plan deterministisch im Bereich",
  (() => {
    const idx = selectNextDayIndex(7, 3);
    return idx >= 0 && idx < 7;
  })());

/* --- selectNextDay (Tagesobjekte, defensive Sortierung) --- */
check("selectNextDay: leerer Plan → null", selectNextDay([], 1) === null);
const unsortedDays = [
  { dayIndex: 2, title: "C" },
  { dayIndex: 0, title: "A" },
  { dayIndex: 1, title: "B" },
];
check("selectNextDay: Montag wählt Tag 0 (auch unsortiert)",
  selectNextDay(unsortedDays, 1)?.dayIndex === 0);
check("selectNextDay: Mittwoch wählt Tag 1",
  selectNextDay(unsortedDays, 3)?.dayIndex === 1);

/* --- Safety-Modul nach ReDoS-Fix: gleiche Erkennung --- */
check("Symptom: Brustschmerzen erkannt",
  detectDangerSymptoms("Ich habe manchmal Brustschmerzen beim Treppensteigen.")
    .includes("Brustschmerzen"));
check("Symptom: Schmerz in der Brust erkannt",
  detectDangerSymptoms("Seit gestern Schmerzen in der Brust.")
    .includes("Brustschmerzen"));
check("Symptom: Atemnot erkannt",
  detectDangerSymptoms("Bei Belastung bekomme ich Atemnot.").includes("Atemnot"));
check("Symptom: Schwindel erkannt",
  detectDangerSymptoms("Mir wird oft schwindlig.").includes("Schwindel"));
check("Symptom: starke Schmerzen erkannt",
  detectDangerSymptoms("Ich habe starke Schmerzen im Rücken.")
    .includes("Starke Schmerzen"));
check("Kein Symptom: normale Knieprobleme → leer",
  detectDangerSymptoms("Leichte Knieschmerzen nach dem Joggen.").length === 0);
check("Kein Symptom: harmloser Text → leer",
  detectDangerSymptoms("Keine Beschwerden, alles gut.").length === 0);
check("Leereingabe → leer", detectDangerSymptoms("").length === 0);

/* --- ReDoS-Härtung: langer Angriffs-String terminiert sofort --- */
const evilInput = "schmerz " + "a".repeat(50000);
detectDangerSymptoms(evilInput); // darf nicht hängen (Substring statt Backtracking)
check("ReDoS: 50k-Zeichen-Eingabe terminiert ohne Hänger", true);

console.log(failures === 0 ? "\nALLE TESTS BESTANDEN" : `\n${failures} TEST(S) FEHLGESCHLAGEN`);
process.exit(failures === 0 ? 0 : 1);

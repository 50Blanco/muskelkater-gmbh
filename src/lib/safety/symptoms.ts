/**
 * Safety-Modul: Erkennung sicherheitsrelevanter Symptome in Freitext.
 * Stellt KEINE Diagnose — liefert nur einen vorsichtigen Hinweis,
 * dass ärztliche Abklärung sinnvoll ist.
 */

interface SymptomRule {
  label: string;
  keywords: string[];
}

/*
 * Substring-Erkennung statt Regex: bewusst ohne `\w*`/`\w+`, damit kein
 * Catastrophic Backtracking (ReDoS) auf langem Freitext möglich ist.
 * Verglichen wird gegen den kleingeschriebenen Text mit `includes()`.
 */
const DANGER_SYMPTOMS: SymptomRule[] = [
  {
    label: "Brustschmerzen",
    keywords: [
      "brustschmerz",
      "brust schmerz",
      "schmerz in der brust",
      "schmerzen in der brust",
      "schmerz an der brust",
      "schmerzen an der brust",
      "druck in der brust",
      "druck auf der brust",
    ],
  },
  {
    label: "Atemnot",
    keywords: ["atemnot", "luftnot", "kurzatmig", "atembeschwerden"],
  },
  { label: "Schwindel", keywords: ["schwindel", "schwindlig"] },
  {
    label: "Herzrasen",
    keywords: ["herzrasen", "herzstolpern", "herzrhythmus"],
  },
  { label: "Ohnmacht", keywords: ["ohnmacht", "bewusstlos", "kollabiert"] },
  {
    label: "Starke Schmerzen",
    keywords: [
      "starke schmerz",
      "starker schmerz",
      "starken schmerz",
      "unerträgliche schmerz",
      "unerträglicher schmerz",
      "unerträglichen schmerz",
    ],
  },
];

/** Findet erwähnte Warnsymptome im Text. Leeres Array = nichts gefunden. */
export function detectDangerSymptoms(text: string | null | undefined): string[] {
  if (!text) return [];
  const haystack = text.toLowerCase();
  return DANGER_SYMPTOMS.filter((s) =>
    s.keywords.some((keyword) => haystack.includes(keyword)),
  ).map((s) => s.label);
}

/** Vorsichtiger Hinweistext, wenn Warnsymptome erkannt wurden. */
export const MEDICAL_WARNING =
  "Deine Angaben enthalten Beschwerden, die du bitte ärztlich abklären lässt, " +
  "bevor du intensiv trainierst. Diese App stellt keine Diagnose und ersetzt " +
  "keinen ärztlichen Rat.";

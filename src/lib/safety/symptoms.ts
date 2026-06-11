/**
 * Safety-Modul: Erkennung sicherheitsrelevanter Symptome in Freitext.
 * Stellt KEINE Diagnose — liefert nur einen vorsichtigen Hinweis,
 * dass ärztliche Abklärung sinnvoll ist.
 */

interface SymptomPattern {
  label: string;
  pattern: RegExp;
}

const DANGER_SYMPTOMS: SymptomPattern[] = [
  {
    label: "Brustschmerzen",
    pattern: /brust\s*schmerz|schmerz\w*\s+(in|an)\s+der\s+brust|druck\s+(in|auf)\s+der\s+brust/i,
  },
  { label: "Atemnot", pattern: /atemnot|luftnot|kurzatmig|atembeschwerden/i },
  { label: "Schwindel", pattern: /schwindel|schwindlig/i },
  { label: "Herzrasen", pattern: /herzrasen|herzstolpern|herzrhythmus/i },
  { label: "Ohnmacht", pattern: /ohnmacht|bewusstlos|kollabiert/i },
  {
    label: "Starke Schmerzen",
    pattern: /starke[nr]?\s+schmerz|unerträglich\w*\s+schmerz/i,
  },
];

/** Findet erwähnte Warnsymptome im Text. Leeres Array = nichts gefunden. */
export function detectDangerSymptoms(text: string | null | undefined): string[] {
  if (!text) return [];
  return DANGER_SYMPTOMS.filter((s) => s.pattern.test(text)).map(
    (s) => s.label,
  );
}

/** Vorsichtiger Hinweistext, wenn Warnsymptome erkannt wurden. */
export const MEDICAL_WARNING =
  "Deine Angaben enthalten Beschwerden, die du bitte ärztlich abklären lässt, " +
  "bevor du intensiv trainierst. Diese App stellt keine Diagnose und ersetzt " +
  "keinen ärztlichen Rat.";

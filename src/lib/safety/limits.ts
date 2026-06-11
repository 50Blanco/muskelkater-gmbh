/**
 * Safety-Modul: Plausibilitätsgrenzen für Körperdaten.
 * Werte außerhalb dieser Bereiche werden im Onboarding abgelehnt —
 * sowohl clientseitig (UX) als auch serverseitig (Server Action).
 */
export const PLAUSIBILITY = {
  ageYears: { min: 16, max: 90 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 300 },
  waistCm: { min: 40, max: 250 },
  armCm: { min: 15, max: 80 },
  daysPerWeek: { min: 2, max: 6 },
} as const;

/** Alter in vollen Jahren aus einem ISO-Datum (YYYY-MM-DD). NaN bei ungültigem Datum. */
export function ageFromBirthDate(birthDate: string, today = new Date()): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return NaN;

  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Geburtsdatum plausibel? (gültiges Datum, Alter innerhalb der Grenzen) */
export function isPlausibleBirthDate(birthDate: string): boolean {
  const age = ageFromBirthDate(birthDate);
  return (
    !Number.isNaN(age) &&
    age >= PLAUSIBILITY.ageYears.min &&
    age <= PLAUSIBILITY.ageYears.max
  );
}

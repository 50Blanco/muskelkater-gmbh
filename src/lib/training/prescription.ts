/**
 * Vorgabe-Werte (Sätze/Wdh./Pause) für neu hinzugefügte Übungen + Order-Helfer.
 * Pure Logik ohne DB/React — testbar. Bewusst einfach gehalten (MVP).
 */

export interface Prescription {
  targetSets: number;
  targetReps: number;
  targetRestSec: number;
}

/**
 * Sinnvolle Default-Vorgabe beim Hinzufügen einer Übung zu einem Trainingstag.
 * Grundübungen (compound) etwas schwerer/länger Pause, Isolation moderater.
 */
export function defaultPrescription(isCompound: boolean): Prescription {
  return isCompound
    ? { targetSets: 4, targetReps: 8, targetRestSec: 120 }
    : { targetSets: 3, targetReps: 10, targetRestSec: 90 };
}

/** Nächster freier `order`-Wert für einen Trainingstag (max + 1, leer → 0). */
export function nextOrder(orders: number[]): number {
  if (orders.length === 0) return 0;
  return Math.max(...orders) + 1;
}

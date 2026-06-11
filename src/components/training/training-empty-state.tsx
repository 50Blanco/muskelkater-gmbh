import { ArrowRight, ClipboardList } from "lucide-react";
import { restartOnboarding } from "@/app/(onboarding)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Hinweis, wenn (noch) kein aktiver Trainingsplan existiert. */
export function TrainingEmptyState() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[12px] bg-accent-soft text-accent">
          <ClipboardList className="size-5" />
        </span>
        <div className="space-y-1">
          <CardTitle>Noch kein Trainingsplan</CardTitle>
          <p className="text-sm text-muted">
            Beantworte ein paar kurze Fragen — danach erstellen wir deinen
            persönlichen Plan mit Übungen, Sätzen und Pausen.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form action={restartOnboarding}>
          <Button type="submit" size="lg">
            Onboarding starten
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

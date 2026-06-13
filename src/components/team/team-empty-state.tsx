import { Users2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateGroupForm } from "@/components/social/create-group-form";
import { JoinGroupForm } from "@/components/social/join-group-form";

/** Empty State auf /team: Team erstellen oder per Code beitreten. */
export function TeamEmptyState() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
          <Users2 className="size-5" />
        </span>
        <div>
          <CardTitle>Dein Team</CardTitle>
          <p className="text-xs text-muted">
            Gemeinsam dranbleiben motiviert. Erstelle ein Team oder tritt einem bei.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3.5">
            <p className="text-sm font-medium text-foreground">
              Neues Team erstellen
            </p>
            <p className="text-xs text-muted">
              Du wirst Owner und bekommst einen Einladungscode für dein Team.
            </p>
            <CreateGroupForm />
          </div>
          <div className="space-y-3 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3.5">
            <p className="text-sm font-medium text-foreground">Team beitreten</p>
            <p className="text-xs text-muted">
              Gib den 8-stelligen Code ein, den dir jemand aus deinem Team
              geschickt hat.
            </p>
            <JoinGroupForm />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

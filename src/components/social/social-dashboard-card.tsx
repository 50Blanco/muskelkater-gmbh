import { Users2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SocialDashboardData } from "@/lib/social/get-social-dashboard";
import { GroupMembers } from "./group-members";
import { SocialFeed } from "./social-feed";
import { CreateGroupForm } from "./create-group-form";
import { JoinGroupForm } from "./join-group-form";

interface Props {
  data: SocialDashboardData;
  currentUserId: string;
}

/** Social-Bereich auf /heute: Crew-Übersicht + Feed. */
export function SocialDashboardCard({ data, currentUserId }: Props) {
  return (
    <Card className="sm:col-span-2">
      <CardHeader className="flex-row items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent">
          <Users2 className="size-5" />
        </span>
        <div>
          <CardTitle>
            {data.activeGroup ? data.activeGroup.name : "Deine Crew"}
          </CardTitle>
          <p className="text-xs text-muted">
            {data.activeGroup
              ? "Heute in deiner Gruppe"
              : "Noch keine Gruppe — starte oder tritt einer bei."}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {data.activeGroup === null ? (
          <EmptyState />
        ) : (
          <>
            <GroupMembers
              group={data.activeGroup}
              members={data.members}
              currentUserId={currentUserId}
            />
            <div className="h-px bg-border" />
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-dim">
                Aktivitäten (7 Tage)
              </p>
              <SocialFeed events={data.feed} groupId={data.activeGroup.id} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Trainiere gemeinsam — sieh, wer heute aktiv war, und motiviere deine
        Crew mit einer kurzen Reaktion.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3.5">
          <p className="text-sm font-medium text-foreground">Neue Crew erstellen</p>
          <p className="text-xs text-muted">
            Du wirst Owner und bekommst einen Einladungscode für deine Crew.
          </p>
          <CreateGroupForm />
        </div>
        <div className="space-y-3 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3.5">
          <p className="text-sm font-medium text-foreground">Crew beitreten</p>
          <p className="text-xs text-muted">
            Gib den 8-stelligen Code ein, den dir jemand aus deiner Crew geschickt hat.
          </p>
          <JoinGroupForm />
        </div>
      </div>
    </div>
  );
}

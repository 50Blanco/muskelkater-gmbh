import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeamMemberDetail } from "@/lib/social/get-team-member-detail";
import { memberIdSchema } from "@/lib/validation/challenge";
import { MemberDetail } from "@/components/team/member-detail";

export const metadata: Metadata = { title: "Team-Mitglied" };

interface Props {
  params: Promise<{ memberId: string }>;
}

export default async function MemberDetailPage({ params }: Props) {
  const { memberId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = memberIdSchema.safeParse(memberId);
  if (!parsed.success) notFound();

  // Loader prüft das gemeinsame Team; fremde Mitglieder → notFound.
  const data = await getTeamMemberDetail(user.id, parsed.data);
  if (!data) notFound();

  return <MemberDetail data={data} />;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { MobileTabbar } from "@/components/navigation/mobile-tabbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Zusätzliche Absicherung neben der Middleware.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <DesktopSidebar />
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-5xl px-5 pb-28 pt-8 md:px-8 md:pb-12">
          {children}
        </main>
      </div>
      <MobileTabbar />
    </div>
  );
}

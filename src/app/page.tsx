import { redirect } from "next/navigation";

export default function RootPage() {
  // Auth/Onboarding-Routing übernimmt die Middleware.
  redirect("/heute");
}

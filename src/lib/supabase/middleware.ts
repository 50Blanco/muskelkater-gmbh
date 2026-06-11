import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

/** Routen, die ohne Login erreichbar sind. */
const PUBLIC_PREFIXES = ["/login", "/register", "/auth"];
/** Auth-Seiten, von denen eingeloggte Nutzer weggeleitet werden. */
const AUTH_PAGES = ["/login", "/register"];

const ONBOARDING_PATH = "/onboarding";
const HOME_PATH = "/heute";

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Aktualisiert die Supabase-Session anhand der Request-Cookies und erzwingt
 * die Zugriffsregeln:
 *  - nicht eingeloggt + geschützte Route  → /login
 *  - eingeloggt + Onboarding offen         → /onboarding
 *  - eingeloggt + Onboarding fertig + Auth → /heute
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // WICHTIG: getUser() validiert das Token serverseitig (nicht getSession()).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // gesetzte Session-Cookies auf die Redirect-Antwort übertragen
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // 1) Nicht eingeloggt → nur öffentliche Routen erlauben
  if (!user) {
    if (isPublic(pathname)) return response;
    return redirectTo("/login");
  }

  // 2) Eingeloggt
  const onboardingCompleted = Boolean(
    user.user_metadata?.onboarding_completed,
  );

  // Auth-Seiten für eingeloggte Nutzer sperren
  if (AUTH_PAGES.includes(pathname)) {
    return redirectTo(onboardingCompleted ? HOME_PATH : ONBOARDING_PATH);
  }

  // Onboarding-Gate
  if (!onboardingCompleted) {
    if (pathname === ONBOARDING_PATH || pathname.startsWith("/auth")) {
      return response;
    }
    return redirectTo(ONBOARDING_PATH);
  }

  // Onboarding fertig → /onboarding nicht mehr nötig
  if (pathname === ONBOARDING_PATH) {
    return redirectTo(HOME_PATH);
  }

  return response;
}

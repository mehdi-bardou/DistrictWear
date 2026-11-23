import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export const proxy = createMiddleware(routing);

export const config = {
  // /admin, /api, /_next and static files are handled outside locale routing.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};

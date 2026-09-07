import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = ["/signin", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!req.auth && !isPublic) {
    const signin = new URL("/signin", req.nextUrl.origin);
    signin.searchParams.set("next", pathname + req.nextUrl.search);
    return Response.redirect(signin);
  }

  if (req.auth && pathname === "/signin") {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};

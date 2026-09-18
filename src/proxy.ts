import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ req, token }) {
      const { pathname } = req.nextUrl

      // Explicit Public Route Allowlist
      const isPublicRoute =
        pathname === "/" ||
        pathname === "/about" ||
        pathname === "/goals" ||
        pathname === "/mission" ||
        pathname === "/contact" ||
        pathname === "/login" ||
        pathname === "/unauthorized" ||
        pathname.startsWith("/member-request") ||
        pathname.startsWith("/api/public") ||
        pathname.startsWith("/api/auth")

      if (isPublicRoute) {
        return true
      }

      // All protected routes require a valid session token
      return !!token
    },
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets & favicons
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

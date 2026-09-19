import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for public routes:
     * - api/auth, api/v1, api/public
     * - _next/static, _next/image, images, favicon.ico
     * - login, member-request
     * - public pages: about, goals, mission, contact, root (^)
     */
    "/((?!api/auth|api/v1|api/public|_next/static|_next/image|images|favicon.ico|login|member-request|about|goals|mission|contact|$).*)",
  ],
}

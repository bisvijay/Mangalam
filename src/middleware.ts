import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // Dashboard routes require authentication
      if (path.startsWith("/dashboard")) {
        return !!token;
      }

      // API routes under /api/admin require authentication
      if (path.startsWith("/api/admin")) {
        return !!token;
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};

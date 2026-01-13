import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: ["/today/:path*", "/checkin/:path*", "/history/:path*", "/settings/:path*"],
};



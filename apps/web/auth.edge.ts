import { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const authEdgeConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
};

export default authEdgeConfig;

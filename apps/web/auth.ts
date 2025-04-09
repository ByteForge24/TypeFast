export const runtime = "nodejs"; // ✅ REQUIRED

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "./auth.config";
import prisma from "./DB_prisma/src";
import { getUserById } from "./db/user";

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: { signIn: "/auth" },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;
      const existing = await getUserById(user.id!);
      return !!existing?.emailVerified;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  ...authConfig,
});

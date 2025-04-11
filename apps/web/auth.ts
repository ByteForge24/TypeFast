export const runtime = "nodejs"; // ✅ REQUIRED

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "./auth.config";
import { getUserById } from "./db/user";

let authInstance: any = null;

async function getAuthInstance() {
  if (authInstance) return authInstance;
  
  const prismaModule = await import("./DB_prisma/src");
  const prisma = prismaModule.default;
  
  authInstance = NextAuth({
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
  
  return authInstance;
}

export async function auth() {
  const authConfig = await getAuthInstance();
  return authConfig.auth();
}

export async function handlers() {
  const authConfig = await getAuthInstance();
  return authConfig.handlers;
}

export async function signIn(...args: any[]) {
  const authConfig = await getAuthInstance();
  return authConfig.signIn(...args);
}

export async function signOut(...args: any[]) {
  const authConfig = await getAuthInstance();
  return authConfig.signOut(...args);
}

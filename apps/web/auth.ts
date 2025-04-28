export const runtime = "nodejs"; // ✅ REQUIRED

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "./auth.config";


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
      async jwt({ token, user, account }) {
        // When user logs in (initially), add their ID to the token
        if (user) {
          token.sub = user.id;
          // Preserve user fields in token for session callback
          token.email = user.email;
          token.name = user.name;
          token.image = user.image;
        }
        return token;
      },
      async signIn({ user, account }) {
        // OAuth providers (Google, GitHub, etc.) - allow sign-in
        // PrismaAdapter handles user creation/linking before this callback
        if (account?.provider !== "credentials") {
          console.log("[Auth.signIn] OAuth provider allowed:", account?.provider);
          return true;
        }
        
        // Credentials provider - verify email is verified
        // The authorize function already returned emailVerified in the user object
        if (!user.id) {
          console.warn("[Auth.signIn] No user ID provided");
          return false;
        }
        
        // Use emailVerified from the user object returned by authorize
        // to avoid extra database query that might timeout on Render
        const isVerified = !!(user as any).emailVerified;
        console.log("[Auth.signIn] Credentials provider auth - emailVerified:", isVerified, "for user:", user.email);
        
        if (!isVerified) {
          console.warn("[Auth.signIn] Email not verified for user:", user.email);
        }
        
        return isVerified;
      },
      async session({ session, token }) {
        // Add user ID from token sub claim
        if (session.user && token.sub) {
          session.user.id = token.sub;
          // Ensure email, name, image are available in session from token
          if (token.email) session.user.email = token.email as string;
          if (token.name) session.user.name = token.name as string;
          if (token.image) session.user.image = token.image as string;
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

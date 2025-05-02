export const runtime = "nodejs"; // ✅ REQUIRED

import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";
import { signInSchema } from "./common/src/schemas";
import { getUserByEmail } from "./db/user";

const authConfig = {
  // Required for Render, Vercel, and other reverse-proxy deployments
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      async authorize(credentials) {
        try {
          // Extract only email and password from credentials
          // (other properties like redirect, callbackUrl may also be present)
          const email = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;
          
          if (!email || !password) {
            console.log("[AUTH] Missing email or password in credentials");
            return null;
          }
          
          console.log("[AUTH] Attempting to authorize:", { email, passwordLength: password.length });
          
          const user = await getUserByEmail(email);
          if (!user) {
            console.log("[AUTH] User not found in database:", email);
            return null;
          }
          
          if (!user.password) {
            console.log("[AUTH] User exists but has no password:", email);
            return null;
          }

          // Verify password matches
          const passwordMatches = await bcrypt.compare(password, user.password);
          console.log("[AUTH] Password verification:", { email, matches: passwordMatches });
          
          if (!passwordMatches) {
            return null;
          }

          // Return minimal user object for auth token
          const authUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
          
          console.log("[AUTH] ✓ Authorization successful:", { id: user.id, email: user.email });
          return authUser;
        } catch (error) {
          console.error("[AUTH] Authorize error:", error instanceof Error ? error.message : error);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;

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
        // Extract only email and password from credentials (frontend may pass additional fields like redirect, callbackUrl)
        const validation = signInSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });
        if (!validation.success) {
          console.error("[AUTH] Validation failed:", validation.error);
          return null;
        }

        const { email, password } = validation.data;
        console.log("[AUTH] Attempting to authorize user:", email);
        
        const user = await getUserByEmail(email);
        if (!user) {
          console.error("[AUTH] User not found:", email);
          return null;
        }
        if (!user.password) {
          console.error("[AUTH] User has no password:", email);
          return null;
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          console.error("[AUTH] Password mismatch for:", email);
          return null;
        }

        // Check email is verified
        if (!user.emailVerified) {
          console.error("[AUTH] Email not verified for:", email);
          return null;
        }

        console.log("[AUTH] Authorization successful for:", email);
        // Return user object with required fields for NextAuth
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;

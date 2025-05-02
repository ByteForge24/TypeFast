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
          const validation = signInSchema.safeParse({
            email: credentials?.email,
            password: credentials?.password,
          });
          if (!validation.success) {
            console.log("[AUTH] Validation failed");
            return null;
          }

          const { email, password } = validation.data;
          console.log("[AUTH] Looking for user:", email);
          
          const user = await getUserByEmail(email);
          console.log("[AUTH] User found:", !!user, "has password:", !!user?.password);
          
          if (!user) {
            console.log("[AUTH] User not found");
            return null;
          }
          
          if (!user.password) {
            console.log("[AUTH] User has no password");
            return null;
          }
          
          const isPasswordValid = await bcrypt.compare(password, user.password);
          console.log("[AUTH] Password valid:", isPasswordValid);
          
          if (!isPasswordValid) {
            return null;
          }

          console.log("[AUTH] Authorization successful for:", email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("[AUTH] Authorize error:", error);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;

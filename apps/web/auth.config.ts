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
          if (!validation.success) return null;

          const { email, password } = validation.data;
          const user = await getUserByEmail(email);
          
          if (!user?.password) return null;
          if (!(await bcrypt.compare(password, user.password))) return null;

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

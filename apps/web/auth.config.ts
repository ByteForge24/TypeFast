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
        if (!validation.success) return null;

        const { email, password } = validation.data;
        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;

        const match = await bcrypt.compare(password, user.password);
        if (!match) return null;

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

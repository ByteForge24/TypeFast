export const runtime = "nodejs"; // ✅ REQUIRED

import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";
import { signInSchema } from "./common/src/schemas";
import { getUserByEmail } from "./db/user";

const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const validation = signInSchema.safeParse(credentials);
        if (!validation.success) return null;

        const { email, password } = validation.data;
        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;

        const match = await bcrypt.compare(password, user.password);
        return match ? user : null;
      },
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;

"use server";

import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/db/user";
import { sendVerificationEmail } from "@/lib/resend";
import { signUpSchema, SignUpValues } from "../common/src/schemas";
import prisma from "../DB_prisma/src/index";
import { generateVerificationToken } from "@/lib/utils";

export const register = async (values: SignUpValues) => {
  try {
    const validation = signUpSchema.safeParse(values);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        message: firstError?.message ?? "Invalid credentials",
      };
    }

    const { name, email, password } = validation.data;

    const existingUser = await getUserByEmail(email);
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Link credentials to existing OAuth account
      if (!existingUser.password) {
        // User came from OAuth, now adding credentials
        await prisma.user.update({
          where: { email },
          data: {
            password: hashedPassword,
            name: name || existingUser.name, // Keep OAuth name if not provided
            emailVerified: new Date(),
          },
        });
      } else {
        // User already has credentials
        return { success: false, message: "User with this email already exists" };
      }
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          emailVerified: new Date(), // Auto-verify in production
        },
      });
    }

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);

    return { success: true, message: "Confirmation email sent! Check your inbox." };
  } catch (error) {
    console.error("Registration error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    if (message.includes("RESEND_API_KEY") || message.includes("FRONTEND_URL")) {
      return {
        success: false,
        message: "Email service not configured. Please contact support.",
      };
    }

    if (message.includes("Failed to send verification email")) {
      return {
        success: false,
        message: "Account created but verification email failed. Please try logging in.",
      };
    }

    return { success: false, message };
  }
};

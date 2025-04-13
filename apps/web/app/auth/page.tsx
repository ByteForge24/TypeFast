"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "../../ui/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../ui/src/components/ui/tabs";
import { Chrome, TriangleAlert } from "lucide-react";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/constants";
import SignInForm from "@/components/auth/signin-form";
import SignUpForm from "@/components/auth/signup-form";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "This email is already registered with a different sign-in method.",
  OAuthCallback: "Error during Google sign-in. Please try again.",
  OAuthCallbackError: "Google sign-in failed. Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set, and add https://typefast.onrender.com/api/auth/callback/google to Authorized redirect URIs in Google Cloud Console.",
  OAuthCreateAccount: "Could not create account. Please try again.",
  OAuthSignin: "Could not start Google sign-in. Check your Google OAuth configuration.",
  CredentialsSignin: "Invalid email or password, or email not verified.",
  Default: "An authentication error occurred.",
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
    },
  },
};

const AuthPageContent = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_LOGIN_REDIRECT;
  const errorParam = searchParams.get("error");
  const errorMessage = errorParam
    ? AUTH_ERROR_MESSAGES[errorParam] ?? AUTH_ERROR_MESSAGES.Default
    : null;

  const handleClick = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="flex items-center justify-center mt-10 p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-4"
      >
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/15 text-destructive text-sm border border-destructive/30">
            <TriangleAlert className="size-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-neutral-200">
              Welcome to TypeFast
            </CardTitle>
            <CardDescription className="text-center text-neutral-400">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-neutral-800 text-neutral-300">
                <TabsTrigger
                  value="signin"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 text-sm font-medium ring-offset-neutral-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-50 data-[state=active]:shadow-sm"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 text-sm font-medium ring-offset-neutral-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-50 data-[state=active]:shadow-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <SignInForm callbackUrl={callbackUrl} />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm callbackUrl={callbackUrl} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleClick}>
              <Chrome />
              <span>Continue with Google</span>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

const AuthPage = () => (
  <Suspense fallback={<div className="flex justify-center mt-10 p-4 min-h-[400px] items-center">Loading...</div>}>
    <AuthPageContent />
  </Suspense>
);

export default AuthPage;

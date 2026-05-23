"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { useAuthStore } from "@/store/use-auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();

  // Redirect to dashboard if already logged in with a valid profile
  React.useEffect(() => {
    if (user && profile) {
      router.push("/dashboard");
    }
  }, [user, profile, router]);

  const handleNavigateToSignup = () => {
    router.push("/signup");
  };

  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to access your hyperlocal operating system workspace."
    >
      <LoginForm onNavigateToSignup={handleNavigateToSignup} />
    </AuthCard>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RoleSelection } from "@/components/auth/role-selection";
import { SignupForm } from "@/components/auth/signup-form";
import { useAuthStore } from "@/store/use-auth-store";
import { AnimatePresence, motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [role, setRole] = React.useState<"student" | "business" | null>(null);

  // Redirect to dashboard if already logged in with a valid profile
  React.useEffect(() => {
    if (user && profile) {
      router.push("/dashboard");
    }
  }, [user, profile, router]);

  const handleRoleSelect = (selectedRole: "student" | "business") => {
    setRole(selectedRole);
  };

  const handleBackToRoleSelection = () => {
    setRole(null);
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <AuthCard
      title={role ? "Create Account" : "Choose Your Path"}
      subtitle={
        role
          ? "Set up your credentials to join the operating system."
          : "Select how you would like to participate in the HyperHire network."
      }
    >
      <AnimatePresence mode="wait">
        {!role ? (
          <motion.div
            key="role-select"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
          >
            <RoleSelection
              onSelect={handleRoleSelect}
              onBackToLogin={handleBackToLogin}
            />
          </motion.div>
        ) : (
          <motion.div
            key="signup-form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
          >
            <SignupForm
              role={role}
              onBackToRoleSelection={handleBackToRoleSelection}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}

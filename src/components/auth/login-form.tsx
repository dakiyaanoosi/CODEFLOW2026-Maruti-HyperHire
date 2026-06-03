"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore, SerializedUser } from "@/store/use-auth-store";
import { authService } from "@/lib/auth-service";
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { RoleSelection } from "@/components/auth/role-selection";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFields = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateToSignup?: () => void;
}

export function LoginForm({ onSuccess, onNavigateToSignup }: LoginFormProps) {
  const router = useRouter();
  const { setUser, setProfile, setLoading } = useAuthStore();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  // State for handling new Google users who need to pick a role
  const [pendingGoogleUser, setPendingGoogleUser] = React.useState<SerializedUser | null>(null);
  const [isCompletingSignup, setIsCompletingSignup] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      setLoading(true);
      const res = await authService.loginWithEmail(data.email, data.password);
      setUser(res.user);
      setProfile(res.profile);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      setLoading(true);
      const res = await authService.loginWithGoogle();
      if (res.status === "existing") {
        // Existing user — log in directly
        setUser(res.user);
        setProfile(res.profile);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard");
        }
      } else if (res.status === "needs_role") {
        // New Google user — show role selection
        setPendingGoogleUser(res.user);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
      setLoading(false);
    }
  };

  const handleRoleSelectedForGoogle = async (role: "student" | "business") => {
    if (!pendingGoogleUser) return;
    setIsCompletingSignup(true);
    setErrorMsg(null);
    try {
      setLoading(true);
      const profile = await authService.completeGoogleSignup(
        pendingGoogleUser.uid,
        pendingGoogleUser.email || "",
        pendingGoogleUser.displayName || "Google User",
        role
      );
      setUser(pendingGoogleUser);
      setProfile(profile);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsCompletingSignup(false);
      setLoading(false);
    }
  };

  // If a new Google user needs to select a role, show role selection
  if (pendingGoogleUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-1">
          <button
            onClick={() => setPendingGoogleUser(null)}
            className="p-1.5 hover:bg-brand-surface-soft rounded-lg text-brand-muted hover:text-brand-ink transition-colors"
            title="Back to login"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold bg-brand-surface-soft border border-brand-hairline text-brand-ink px-2.5 py-1 rounded-[6px]">
            Welcome, {pendingGoogleUser.displayName || "new user"}!
          </span>
        </div>

        <p className="text-sm text-brand-body leading-relaxed">
          It looks like this is your first time here. Please select how you'd like to use HyperHire:
        </p>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] text-xs text-red-600 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isCompletingSignup ? (
          <div className="flex items-center justify-center py-8 gap-2 text-brand-muted text-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            Setting up your account...
          </div>
        ) : (
          <RoleSelection onSelect={handleRoleSelectedForGoogle} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] text-xs text-red-600 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-brand-ink uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isSubmitting || isGoogleLoading}
            className={`w-full h-11 px-4 py-2 bg-white text-sm text-brand-ink border rounded-[6px] focus:outline-none transition-colors ${
              errors.email
                ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-brand-hairline focus:border-brand-primary/65"
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-brand-ink uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            {...register("password")}
            id="password"
            type="password"
            placeholder="••••••••"
            disabled={isSubmitting || isGoogleLoading}
            className={`w-full h-11 px-4 py-2 bg-white text-sm text-brand-ink border rounded-[6px] focus:outline-none transition-colors ${
              errors.password
                ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-brand-hairline focus:border-brand-primary/65"
            }`}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isGoogleLoading}
          className="w-full h-11 bg-brand-primary text-white rounded-[12px] font-semibold text-sm transition-colors hover:bg-brand-primary-active disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Log In...
            </>
          ) : (
            "Log In"
          )}
        </button>
      </form>

      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-hairline" />
        </div>
        <span className="relative px-3 bg-white text-xs text-brand-muted uppercase tracking-wider font-semibold">
          Or Continue With
        </span>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={isSubmitting || isGoogleLoading}
        className="w-full h-11 border border-brand-hairline bg-white text-brand-ink rounded-[12px] font-semibold text-sm transition-colors hover:bg-brand-surface-soft disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5"
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Image
            src="/googleG.png"
            alt="Google"
            width={18}
            height={18}
            className="shrink-0"
          />
        )}
        <span>Google Account</span>
      </button>

      {onNavigateToSignup && (
        <div className="text-center pt-2">
          <button
            onClick={onNavigateToSignup}
            className="text-xs text-brand-muted hover:text-brand-ink transition-colors font-medium"
          >
            Don't have an account? Sign Up
          </button>
        </div>
      )}
    </div>
  );
}
export default LoginForm;

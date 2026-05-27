"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/store/use-auth-store";
import { authService } from "@/lib/auth-service";
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";

const signupSchema = z.object({
  name: z.string().min(1, "Full name is required").max(50, "Name must be under 50 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFields = z.infer<typeof signupSchema>;

interface SignupFormProps {
  role: "student" | "business";
  onBackToRoleSelection: () => void;
  onSuccess?: () => void;
}

export function SignupForm({ role, onBackToRoleSelection, onSuccess }: SignupFormProps) {
  const router = useRouter();
  const { setUser, setProfile, setLoading } = useAuthStore();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFields) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      setLoading(true);
      const res = await authService.signUpWithEmail(data.email, data.password, data.name, role);
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

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      setLoading(true);
      const res = await authService.loginWithGoogle(role);
      if (res.status === "existing") {
        setUser(res.user);
        setProfile(res.profile);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard");
        }
      }
      // When role is provided (signup page), status is always "existing"
    } catch (err: any) {
      console.error(err);
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
      setLoading(false);
    }
  };

  const roleText = role === "student" ? "Student Talent" : "Business Owner";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-1">
        <button
          onClick={onBackToRoleSelection}
          className="p-1.5 hover:bg-brand-surface-soft rounded-lg text-brand-muted hover:text-brand-ink transition-colors"
          title="Back to role selection"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold bg-brand-surface-soft border border-brand-hairline text-brand-ink px-2.5 py-1 rounded-[6px]">
          Signing up as {roleText}
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] text-xs text-red-600 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-brand-ink uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            {...register("name")}
            id="name"
            type="text"
            placeholder="John Doe"
            disabled={isSubmitting || isGoogleLoading}
            className={`w-full h-11 px-4 py-2 bg-white text-sm text-brand-ink border rounded-[6px] focus:outline-none transition-colors ${
              errors.name
                ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-brand-hairline focus:border-brand-primary/65"
            }`}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.name.message}</p>
          )}
        </div>

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
              <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
            </>
          ) : (
            "Create Account"
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
        onClick={handleGoogleSignUp}
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
    </div>
  );
}
export default SignupForm;

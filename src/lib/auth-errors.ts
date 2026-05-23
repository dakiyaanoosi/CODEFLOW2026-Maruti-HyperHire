/**
 * Maps raw Firebase Auth error codes or message strings to clear, user-friendly, and actionable terms.
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  const code = error?.code || "";
  const message = error?.message || "";

  // Map by explicit Firebase Auth Error Code
  switch (code) {
    case "auth/invalid-credential":
      return "The email or password you entered is incorrect. Please double check and try again.";
    case "auth/user-profile-not-found":
      return "No HyperHire profile was found for this account. Please sign up first.";
    case "auth/user-not-found":
      return "We couldn't find an account with this email. Please sign up first.";
    case "auth/wrong-password":
      return "The password you entered is incorrect. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Your password is too weak. Please use at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in window was closed before completion. Please try again.";
    case "auth/network-request-failed":
      return "A network error occurred. Please check your internet connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Access to this account has been temporarily disabled. Please try again later.";
    default:
      break;
  }

  // Fallback pattern matching for simulated/local errors or message texts
  if (message.includes("email-already-in-use")) {
    return "An account with this email address already exists. Try logging in instead.";
  }
  if (message.includes("user-profile-not-found")) {
    return "No HyperHire profile was found for this account. Please sign up first.";
  }
  if (message.includes("user-not-found")) {
    return "We couldn't find an account with this email. Please sign up first.";
  }
  if (message.includes("wrong-password")) {
    return "The password you entered is incorrect. Please try again.";
  }
  if (message.includes("invalid-credential")) {
    return "The email or password you entered is incorrect. Please double check and try again.";
  }
  if (message.includes("popup-closed-by-user")) {
    return "Sign-in window was closed before completion. Please try again.";
  }

  // Remove raw Firebase prefix tags to clean up unmapped errors
  return message.replace(/^Firebase:\s*/, "");
}

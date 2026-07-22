import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/app/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Create account"
      title="Create your account with Google."
      description="New users land here first, then return to the protected main page after authentication."
    >
      <SignUp
        fallbackRedirectUrl="/"
        signInUrl="/sign-in"
      />
    </AuthShell>
  );
}

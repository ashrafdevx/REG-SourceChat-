import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/app/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in with Google to reach your reading dashboard."
      description="Use the Clerk-powered Google flow to access the protected home page and your account menu."
    >
      <SignIn
        fallbackRedirectUrl="/"
        signUpUrl="/sign-up"
      />
    </AuthShell>
  );
}

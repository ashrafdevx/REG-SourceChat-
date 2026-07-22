'use client';

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

export function AuthNavActions() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="h-10 w-28 rounded-full bg-white/5" />;
  }

  return (
    <div className="flex items-center gap-3">
      {isSignedIn ? (
        <UserButton showName={false} />
      ) : (
        <>
          <SignInButton>
            <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">
              Sign up
            </button>
          </SignUpButton>
        </>
      )}
    </div>
  );
}

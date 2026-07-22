import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthNavActions } from "@/app/nav-actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reg BK Reading",
  description: "Protected reading dashboard with Clerk authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <ClerkProvider
          afterSignOutUrl="/sign-in"
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-sky-300">
                  Reg BK Reading
                </p>
                <p className="text-sm text-slate-400">Protected workspace</p>
              </div>
              <AuthNavActions />
            </div>
          </header>
          <div className="flex-1">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}

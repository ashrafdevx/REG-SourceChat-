import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.2),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#111827_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-sky-950/20 backdrop-blur-xl sm:p-10 lg:min-h-[40rem]">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                {eyebrow}
              </p>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">Auth flow</p>
                <p className="mt-2 text-sm font-medium text-white">
                  Google only
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">Access</p>
                <p className="mt-2 text-sm font-medium text-white">
                  Sign in or sign up
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">Destination</p>
                <p className="mt-2 text-sm font-medium text-white">Main page</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center rounded-[2rem] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-6">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useUser } from "@clerk/nextjs";
import type { FormEvent } from "react";
import { useRef, useState } from "react";

type PdfItem = {
  id: string;
  name: string;
  sizeLabel: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  pending?: boolean;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4 12 16-8-5 16-3-7-8-1Z"
      />
    </svg>
  );
}

export function ReaderWorkspace() {
  const { user } = useUser();
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasPdfs = pdfs.length > 0;
  const userName =
    user?.fullName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    "User";
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";

  const handleFilesSelected = async () => {
    const files = fileInputRef.current?.files;

    if (!files) {
      return;
    }

    const nextItems = Array.from(files)
      .filter(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"),
      )
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        sizeLabel: formatFileSize(file.size),
      }));

    setPdfs((currentItems) => {
      const merged = [...currentItems];

      for (const item of nextItems) {
        const exists = merged.some((currentItem) => currentItem.id === item.id);
        if (!exists) {
          merged.push(item);
        }
      }

      return merged;
    });

    // For each selected file, send it to the backend immediately.
    // The server controller logs the uploaded file info to the console.
    for (const file of Array.from(files)) {
      if (
        !(
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
        )
      ) {
        continue;
      }

      try {
        const form = new FormData();
        form.append("file", file, file.name);

        // Adjust host/port if your server runs elsewhere.
        const res = await fetch("http://localhost:8080/api/upload", {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          console.error("Upload failed", await res.text());
        } else {
          const json = await res.json();
          console.log("Upload response:", json);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePromptSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    setConversation((currentConversation) => [
      {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmedPrompt,
        timestamp,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "AI response will appear here after the next plan connects the model.",
        timestamp,
        pending: true,
      },
      ...currentConversation,
    ]);
    setPrompt("");
  };

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid flex-1 gap-5 lg:grid-cols-[2.4fr_7.6fr]">
          <aside className="flex flex-col rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-sky-950/20 backdrop-blur-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-sky-300">
                  PDF Library
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Uploaded files
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                {pdfs.length} file{pdfs.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-6 rounded-3xl border border-dashed border-sky-400/25 bg-sky-400/5 p-4">
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={handleFilesSelected}
              />
              <p className="text-sm font-medium text-sky-200">Upload PDFs</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Add the documents you want to read.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                <UploadIcon />
                <span>Upload PDF</span>
              </button>
            </div>

            <div className="mt-6 flex-1 space-y-3 overflow-hidden">
              {pdfs.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">
                      No PDFs uploaded yet
                    </p>
                    <p className="text-sm leading-6 text-slate-400">
                      Add one or more PDF files to populate this panel.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pdfs.map((pdf) => (
                    <article
                      key={pdf.id}
                      className="rounded-3xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
                          PDF
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {pdf.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {pdf.sizeLabel}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[42rem] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/75 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(15,23,42,0.4),rgba(16,185,129,0.1))] px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#38bdf8,#34d399)] bg-cover bg-center text-base font-bold text-slate-950 shadow-lg shadow-sky-950/30"
                    style={
                      user?.imageUrl
                        ? { backgroundImage: `url(${user.imageUrl})` }
                        : undefined
                    }
                    aria-label={userName}
                  >
                    {user?.imageUrl ? null : userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {userName}
                    </p>
                    <div className="mt-1 overflow-hidden">
                      <p className="tiny-marquee text-[0.62rem] font-medium uppercase tracking-[0.22em] text-slate-400">
                        quick notes • page refs • tiny insights • clean
                        summaries • document highlights
                      </p>
                    </div>
                  </div>
                </div>
                {hasPdfs ? (
                  <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                    <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-300">
                      Threaded history
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid flex-1 grid-rows-[1fr_auto]">
              {hasPdfs ? (
                <>
                  <div className="space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                    {conversation.length === 0 ? (
                      <div className="flex min-h-[26rem] items-center justify-center rounded-[1.25rem] border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center">
                        <div className="max-w-lg space-y-4">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-200">
                            PDF
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-white">
                              Conversation history will appear here
                            </p>
                            <p className="text-sm leading-6 text-slate-400">
                              Type your first message to start the thread.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {conversation.map((message) => (
                          <article
                            key={message.id}
                            className={`flex ${
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[92%] rounded-[1.6rem] border px-4 py-4 shadow-lg sm:max-w-3xl sm:px-5 ${
                                message.role === "user"
                                  ? "border-sky-400/20 bg-[linear-gradient(135deg,rgba(56,189,248,0.95),rgba(96,165,250,0.86))] text-slate-950"
                                  : message.pending
                                    ? "border-amber-400/20 bg-[linear-gradient(135deg,rgba(23,37,84,0.88),rgba(15,23,42,0.96))] text-slate-100"
                                    : "border-white/10 bg-white/5 text-slate-100"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-80">
                                  {message.role === "user"
                                    ? "You"
                                    : "Assistant"}
                                </p>
                                <span className="text-[0.7rem] font-medium uppercase tracking-[0.22em] opacity-70">
                                  {message.timestamp}
                                </span>
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 sm:text-[0.95rem]">
                                {message.text}
                              </p>
                              {message.pending ? (
                                <div className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-amber-200/80">
                                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                                  Waiting for AI integration
                                </div>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={handlePromptSubmit}
                    className="border-t border-white/10 bg-slate-950/95 p-3 sm:p-4"
                  >
                    <div className="p-0">
                      <label htmlFor="prompt" className="sr-only">
                        Prompt
                      </label>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <textarea
                          id="prompt"
                          value={prompt}
                          onChange={(event) => setPrompt(event.target.value)}
                          placeholder="Type a message..."
                          className="min-h-24 flex-1 resize-none rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-sky-400/50"
                        />
                        <button
                          type="submit"
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#34d399,#22c55e)] text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:brightness-110"
                          aria-label="Send message"
                        >
                          <SendIcon />
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex min-h-[28rem] items-center justify-center px-4 py-8 sm:px-6">
                  <div className="w-full max-w-xl rounded-[2rem] border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-200">
                      PDF
                    </div>
                    <p className="mt-5 text-2xl font-semibold text-white">
                      Add PDFs to start
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Upload a valid PDF from the left panel, then the composer
                      and chat history will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

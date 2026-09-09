import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CodePanel, type Snippet } from "@/demo/table/components/CodePanel";

/**
 * Every lesson page has the same three parts:
 *   1. the point (one paragraph, no code)
 *   2. the live table, wired to exactly the feature being taught
 *   3. the code that made it happen, with the relevant lines spotlighted
 */
export function Lesson({
  title,
  tagline,
  snippets,
  children,
  takeaways,
}: {
  title: string;
  tagline: string;
  snippets: Snippet[];
  children: ReactNode;
  takeaways?: ReactNode[];
}) {
  return (
    <div className="pb-20">
      <header className="mb-5">
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-neutral-500">{tagline}</p>
      </header>

      {/* the code column is a share of the width, not a fixed 480px, so
          collapsing the lesson nav actually gives the snippets more room */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,1fr)]">
        <div className="min-w-0 space-y-4">{children}</div>
        <div className="min-w-0">
          <CodePanel snippets={snippets} className="xl:sticky xl:top-6" />
        </div>
      </div>

      {takeaways && takeaways.length > 0 && (
        <section className="mt-6 rounded-xl border border-amber-200/70 bg-amber-50/70 p-4">
          <h2 className="text-xs font-semibold tracking-wide text-amber-900 uppercase">
            Say this out loud
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-amber-950/85">
            {takeaways.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** A labelled box around a live control strip, so the demo reads as a demo. */
export function Controls({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3 shadow-[0_1px_2px_oklch(0_0_0/0.04)]", className)}>
      {children}
    </div>
  );
}

/** Live state readout - the state object is the whole mental model, so show it. */
export function StateReadout({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="tbl-scroll overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 p-3">
      <div className="mb-1 font-mono text-[11px] text-neutral-500">{label}</div>
      <pre className="font-mono text-[11px] whitespace-pre-wrap text-emerald-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "blue";
}) {
  const tones = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  } as const;
  return (
    <span className={cn("inline-block rounded border px-1.5 py-0.5 text-[11px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}

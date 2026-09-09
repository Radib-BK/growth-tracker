import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A tiny TS/TSX highlighter. Deliberately not a dependency: the session is about
 * TanStack Table, and one 60 line tokenizer beats shipping a syntax engine.
 */
const KEYWORDS = new Set([
  "import", "from", "export", "default", "const", "let", "var", "function", "return",
  "type", "interface", "as", "if", "else", "for", "of", "in", "new", "await", "async",
  "true", "false", "null", "undefined", "class", "extends", "typeof", "keyof", "satisfies",
]);

type Tok = { text: string; kind: string };

/** One pass: comments and strings first (they swallow everything), then words. */
function tokenize(line: string): Tok[] {
  const out: Tok[] = [];
  const re =
    /(\/\/[^\n]*)|(`[^`]*`|"[^"]*"|'[^']*')|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\s\w$])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [text, comment, str, num, word, space] = m;
    if (comment) out.push({ text, kind: "comment" });
    else if (str) out.push({ text, kind: "string" });
    else if (num) out.push({ text, kind: "num" });
    else if (word) {
      const next = line[re.lastIndex];
      const kind = KEYWORDS.has(word)
        ? "kw"
        : next === "(" ? "fn"
        : /^[A-Z]/.test(word) ? "type"
        : "plain";
      out.push({ text, kind });
    } else if (space) out.push({ text, kind: "plain" });
    else out.push({ text, kind: "punc" });
  }
  return out;
}

const COLORS: Record<string, string> = {
  comment: "text-neutral-500 italic",
  string: "text-emerald-300",
  num: "text-orange-300",
  kw: "text-violet-300",
  fn: "text-sky-300",
  type: "text-yellow-200",
  punc: "text-neutral-400",
  plain: "text-neutral-200",
};

export type Snippet = {
  /** Shown as the panel title, e.g. "sorting.tsx" */
  label: string;
  code: string;
  /** 1-based line numbers to spotlight - the lines this lesson is actually about. */
  highlight?: number[];
};

export function CodePanel({
  snippets,
  className,
}: {
  snippets: Snippet[];
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const snippet = snippets[Math.min(active, snippets.length - 1)];
  const lines = useMemo(() => snippet.code.replace(/\n+$/, "").split("\n"), [snippet.code]);
  const marked = new Set(snippet.highlight ?? []);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm", className)}>
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-800 bg-neutral-950/60 px-2 py-1.5">
        {snippets.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "rounded px-2 py-1 font-mono text-[11px] whitespace-nowrap",
              i === active
                ? "bg-neutral-800 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <pre className="max-h-[560px] overflow-auto py-3 font-mono text-[12.5px] leading-[1.65]">
        <code>
          {lines.map((line, i) => {
            const n = i + 1;
            const on = marked.has(n);
            return (
              <div
                key={n}
                className={cn(
                  "flex px-2",
                  on && "border-l-2 border-amber-400 bg-amber-400/10 pl-[6px]",
                  !on && marked.size > 0 && "opacity-55",
                )}
              >
                <span className="mr-3 w-7 shrink-0 text-right text-neutral-600 select-none">{n}</span>
                <span className="whitespace-pre">
                  {tokenize(line).map((t, j) => (
                    <span key={j} className={COLORS[t.kind]}>
                      {t.text}
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

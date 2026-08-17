import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Post } from "@/demo/api";

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-white p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-neutral-500">{subtitle}</p>
      {children}
    </section>
  );
}

/** A live true/false badge, so state changes are visible from the back of the room. */
export function Flag({ name, on }: { name: string; on: boolean }) {
  return (
    <span
      className={cn(
        "rounded border px-2 py-1 font-mono text-xs",
        on ? "border-green-600 bg-green-50 text-green-700" : "border-neutral-200 text-neutral-400",
      )}
    >
      {name}: {String(on)}
    </span>
  );
}

export function PostList({ posts, className }: { posts: Post[]; className?: string }) {
  return (
    <ul className={cn("space-y-1 text-sm", className)}>
      {posts.map((post) => (
        <li key={post.id} className="truncate rounded border bg-neutral-50 px-2 py-1">
          <span className="mr-2 font-mono text-xs text-neutral-400">#{post.id}</span>
          {post.title}
        </li>
      ))}
    </ul>
  );
}

export function Skeletons({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="h-7 animate-pulse rounded bg-neutral-200" />
      ))}
    </ul>
  );
}

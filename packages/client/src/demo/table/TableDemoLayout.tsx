import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import "@/demo/table/table-demo.css";
import { totalUserCount } from "@/demo/table/data/users";

/** The running order of the session. Each entry is one self contained idea. */
const lessons = [
  { to: "/demo/table", label: "Why not a <table>?", hint: "the case for headless", end: true },
  { to: "/demo/table/columns", label: "Columns & rows", hint: "accessors, cells, footers" },
  { to: "/demo/table/groups", label: "Column groups", hint: "colSpan / rowSpan headers" },
  { to: "/demo/table/sorting", label: "Sorting", hint: "multi sort, custom sortingFn" },
  { to: "/demo/table/filtering", label: "Filtering & search", hint: "column, global, faceted" },
  { to: "/demo/table/pagination", label: "Pagination", hint: "client and manual" },
  { to: "/demo/table/visibility", label: "Hide & reorder", hint: "visibility, order, sizing" },
  { to: "/demo/table/pinning", label: "Freeze columns", hint: "pinning + sticky offsets" },
  { to: "/demo/table/expanding", label: "Expanding", hint: "sub rows and detail panels" },
  { to: "/demo/table/selection", label: "Row selection", hint: "checkboxes, ids, bulk actions" },
  { to: "/demo/table/grouping", label: "Grouping", hint: "aggregate rows" },
  { to: "/demo/table/kitchen-sink", label: "Kitchen sink", hint: "everything, one instance" },
];

const STORAGE_KEY = "table-demo:nav-collapsed";

export function TableDemoLayout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true",
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  // "[" toggles the nav, so the whole width is available while presenting
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "[" && !typing && !e.metaKey && !e.ctrlKey) setCollapsed((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="tbl-demo mx-auto w-full max-w-[1600px]">
      <div
        className={cn(
          "grid gap-6 transition-[grid-template-columns] duration-200",
          collapsed ? "lg:grid-cols-[48px_minmax(0,1fr)]" : "lg:grid-cols-[240px_minmax(0,1fr)]",
        )}
      >
        <aside className="min-w-0 lg:sticky lg:top-6 lg:h-fit">
          <div className="mb-3 flex items-start gap-2">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              title={`${collapsed ? "Expand" : "Collapse"} the lesson list  ( [ )`}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              aria-expanded={!collapsed}
              className="grid size-7 shrink-0 place-items-center rounded-md border bg-white text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              {collapsed ? "»" : "«"}
            </button>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-900">TanStack Table</div>
                <div className="text-xs text-neutral-500">
                  {totalUserCount} users, all local. No API in this demo.
                </div>
              </div>
            )}
          </div>

          <nav
            className={cn(
              "flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible",
              collapsed && "lg:items-center",
            )}
          >
            {lessons.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                title={collapsed ? `${l.label} — ${l.hint}` : undefined}
                className={({ isActive }) =>
                  cn(
                    "group rounded-md border text-sm whitespace-nowrap lg:whitespace-normal",
                    collapsed ? "lg:grid lg:size-8 lg:place-items-center lg:px-0" : "px-3 py-2",
                    !collapsed && "py-2",
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-800"
                      : "border-transparent text-neutral-600 hover:bg-neutral-100",
                  )
                }
              >
                <span
                  className={cn(
                    "font-mono text-[11px] text-neutral-400",
                    collapsed ? "lg:text-current" : "mr-2",
                  )}
                >
                  {String(i).padStart(2, "0")}
                </span>
                {/* collapsed: the number is the whole item, on lg and up */}
                <span className={collapsed ? "lg:hidden" : undefined}>{l.label}</span>
                {!collapsed && (
                  <span className="hidden text-[11px] text-neutral-400 lg:block lg:pl-7">{l.hint}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState, type CSSProperties } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnPinningState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Lesson, Controls, StateReadout } from "@/demo/table/components/Lesson";
import { flatUsers, fullName, type User } from "@/demo/table/data/users";
import { StatusCell } from "@/demo/table/components/cells";
import { money, shortDate } from "@/demo/table/components/format";

const col = createColumnHelper<User>();

/*
 * Hoisted to module scope on purpose - DO NOT inline `flatUsers.slice(0, 10)`
 * into useReactTable.
 *
 * `.slice()` returns a new array on every render. getCoreRowModel's memo sees
 * a changed `data` reference, fires its onChange, which queues
 * table._autoResetPageIndex() -> resetPageIndex() -> a state update -> another
 * render -> another new array. That is an infinite loop that locks the tab.
 * `data` and `columns` must be referentially stable.
 */
const demoRows = flatUsers.slice(0, 10);


const columns = [
  col.accessor((u) => fullName(u), { id: "name", header: "Name", size: 190 }),
  col.accessor("email", { header: "Email", size: 230 }),
  col.accessor("department", { header: "Department", size: 140 }),
  col.accessor("role", { header: "Role", size: 110 }),
  col.accessor("country", { header: "Country", size: 130 }),
  col.accessor("city", { header: "City", size: 140 }),
  col.accessor("projects", { header: "Projects", size: 100 }),
  col.accessor("joinedAt", { header: "Joined", size: 140, cell: (c) => shortDate(c.getValue()) }),
  col.accessor("lastActive", { header: "Last active", size: 140, cell: (c) => shortDate(c.getValue()) }),
  col.accessor("salary", {
    header: "Salary",
    size: 130,
    cell: (c) => <span className="tabular-nums">{money(c.getValue())}</span>,
  }),
  col.accessor("status", { header: "Status", size: 120, cell: (c) => <StatusCell status={c.getValue()} /> }),
];

/**
 * TanStack gives you the numbers, CSS does the freezing. getStart("left")
 * is the summed width of every pinned column before this one, so it is
 * exactly the `left` offset a sticky cell needs.
 */
function pinStyles(column: Column<User, unknown>): CSSProperties {
  const pinned = column.getIsPinned();
  if (!pinned) return { width: column.getSize() };
  return {
    width: column.getSize(),
    position: "sticky",
    left: pinned === "left" ? column.getStart("left") : undefined,
    right: pinned === "right" ? column.getAfter("right") : undefined,
    zIndex: 1,
  };
}

const snippet = `const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
  left: ["name"],
  right: ["status"],
});

const table = useReactTable({
  data,
  columns,
  state: { columnPinning },
  onColumnPinningChange: setColumnPinning,
  getCoreRowModel: getCoreRowModel(),
});

column.pin("left");    // or "right", or false to unpin
column.getIsPinned();  // "left" | "right" | false
column.getCanPin();

// The pinned columns also come back pre-split, if you would rather
// render three separate <table>s or three groups of cells:
table.getLeftHeaderGroups();
table.getCenterHeaderGroups();
table.getRightHeaderGroups();
row.getLeftVisibleCells();`;

const cssSnippet = `// TanStack does the maths, CSS does the freezing.
// getStart("left")  = total width of pinned columns BEFORE this one
// getAfter("right") = total width of pinned columns AFTER this one
function pinStyles(column) {
  const pinned = column.getIsPinned();
  if (!pinned) return { width: column.getSize() };
  return {
    width: column.getSize(),
    position: "sticky",
    left:  pinned === "left"  ? column.getStart("left") : undefined,
    right: pinned === "right" ? column.getAfter("right") : undefined,
    zIndex: 1,
  };
}

<th style={pinStyles(header.column)}>…</th>
<td style={pinStyles(cell.column)}>…</td>

// Two things people forget:
//  1. sticky cells need an opaque background, or rows show through
//  2. give every column a size - the offsets are computed from them`;

export default function Pinning() {
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["name"],
    right: ["status"],
  });

  const table = useReactTable({
    data: demoRows,
    columns,
    state: { columnPinning },
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Lesson
      title="Freezing columns"
      tagline="Pinning is a state object with two arrays of column ids. The library never applies a single style - it hands you the accumulated offsets and you spend them on position: sticky. That is the headless bargain in one screen."
      snippets={[
        { label: "pinning.ts", code: snippet, highlight: [1, 2, 3, 4, 14, 15, 16] },
        { label: "sticky-css.ts", code: cssSnippet, highlight: [5, 6, 7, 8, 9, 10, 11, 12, 13] },
      ]}
      takeaways={[
        <>Scroll the table sideways: <b>Name</b> stays on the left, <b>Status</b> on the right, and everything in between moves.</>,
        <><code>getStart("left")</code> / <code>getAfter("right")</code> are the only reason multi column freezing is not painful.</>,
        <>Pinned cells must be opaque and sit above the rest - a missing <code>z-index</code> or background is the usual bug.</>,
        <>Row pinning exists too (<code>row.pin("top")</code>), handy for "keep my own record at the top".</>,
      ]}
    >
      <Controls>
        {table.getAllLeafColumns().map((column) => {
          const pinned = column.getIsPinned();
          return (
            <div key={column.id} className="flex items-center gap-1 rounded border px-1.5 py-1 text-[11px]">
              <span className={cn(pinned ? "font-semibold text-blue-700" : "text-neutral-600")}>
                {column.id}
              </span>
              <button
                type="button"
                onClick={() => column.pin(pinned === "left" ? false : "left")}
                className={cn("rounded px-1", pinned === "left" ? "bg-blue-600 text-white" : "hover:bg-neutral-100")}
              >
                ⟨
              </button>
              <button
                type="button"
                onClick={() => column.pin(pinned === "right" ? false : "right")}
                className={cn("rounded px-1", pinned === "right" ? "bg-blue-600 text-white" : "hover:bg-neutral-100")}
              >
                ⟩
              </button>
            </div>
          );
        })}
        <Button size="xs" variant="outline" onClick={() => table.resetColumnPinning()}>
          Unpin all
        </Button>
      </Controls>

      <p className="text-xs text-neutral-500">
        The table below is intentionally wider than the page. Scroll it sideways.
      </p>

      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={pinStyles(header.column)}
                  data-pinned={header.column.getIsPinned() || undefined}
                  className="truncate"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  style={pinStyles(cell.column)}
                  data-pinned={cell.column.getIsPinned() || undefined}
                  className="truncate"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <StateReadout label="columnPinning state" value={columnPinning} />
    </Lesson>
  );
}

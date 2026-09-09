import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnOrderState,
  type VisibilityState,
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
 * Hoisted to module scope on purpose - DO NOT inline `flatUsers.slice(0, 8)`
 * into useReactTable.
 *
 * `.slice()` returns a new array on every render. getCoreRowModel's memo sees
 * a changed `data` reference, fires its onChange, which queues
 * table._autoResetPageIndex() -> resetPageIndex() -> a state update -> another
 * render -> another new array. That is an infinite loop that locks the tab.
 * `data` and `columns` must be referentially stable.
 */
const demoRows = flatUsers.slice(0, 8);


const columns = [
  col.accessor((u) => fullName(u), { id: "name", header: "Name", size: 200, enableHiding: false }),
  col.accessor("email", { header: "Email", size: 240 }),
  col.accessor("department", { header: "Department", size: 140 }),
  col.accessor("role", { header: "Role", size: 100 }),
  col.accessor("status", { header: "Status", size: 110, cell: (c) => <StatusCell status={c.getValue()} /> }),
  col.accessor("country", { header: "Country", size: 130 }),
  col.accessor("city", { header: "City", size: 130 }),
  col.accessor("projects", { header: "Projects", size: 90 }),
  col.accessor("salary", {
    header: "Salary",
    size: 120,
    cell: (c) => <span className="tabular-nums">{money(c.getValue())}</span>,
  }),
  col.accessor("joinedAt", { header: "Joined", size: 130, cell: (c) => shortDate(c.getValue()) }),
];

const allIds = [
  "name", "email", "department", "role", "status",
  "country", "city", "projects", "salary", "joinedAt",
];

const snippet = `const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
  email: false,        // just an id -> boolean map
  country: false,
});
const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([
  "name", "department", "role", "status", "salary", ...
]);

const table = useReactTable({
  data,
  columns,
  state: { columnVisibility, columnOrder },
  onColumnVisibilityChange: setColumnVisibility,
  onColumnOrderChange: setColumnOrder,
  columnResizeMode: "onChange",
  getCoreRowModel: getCoreRowModel(),
});`;

const menuSnippet = `// The column menu writes itself from the table instance.
{table.getAllLeafColumns().map((column) => (
  <label key={column.id}>
    <input
      type="checkbox"
      checked={column.getIsVisible()}
      disabled={!column.getCanHide()}          // enableHiding: false
      onChange={column.getToggleVisibilityHandler()}
    />
    {column.id}
  </label>
))}

table.toggleAllColumnsVisible(true);
table.resetColumnVisibility();

// Why this matters: row.getVisibleCells() already skips hidden columns,
// so the body never learns that a column disappeared. And a hidden column
// still filters and sorts if you ask it to - visibility is presentation only.`;

const sizingSnippet = `// Sizing is numbers, not CSS. You decide what to do with them.
col.accessor("email", { header: "Email", size: 240, minSize: 120, maxSize: 400 })

<th style={{ width: header.getSize() }}>
  {flexRender(header.column.columnDef.header, header.getContext())}

  {/* drag handle - both mouse and touch, already debounced for you */}
  <div
    onMouseDown={header.getResizeHandler()}
    onTouchStart={header.getResizeHandler()}
    className={header.column.getIsResizing() ? "bg-blue-500" : "bg-neutral-200"}
  />
</th>

// columnResizeMode: "onChange" resizes live, "onEnd" waits for mouse up.
// For big tables, "onEnd" (or a CSS variable) keeps the frame rate up.`;

export default function Visibility() {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    email: false,
    country: false,
  });
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(allIds);

  const table = useReactTable({
    data: demoRows,
    columns,
    state: { columnVisibility, columnOrder },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });

  const move = (id: string, delta: number) => {
    setColumnOrder((prev) => {
      const next = [...prev];
      const i = next.indexOf(id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <Lesson
      title="Hide, reorder, resize"
      tagline="Three tiny pieces of state that users always end up asking for. Column visibility is an id→boolean map, order is an array of ids, and sizing is a number per column that you are free to apply however you want."
      snippets={[
        { label: "state.ts", code: snippet, highlight: [1, 2, 3, 4, 5, 6, 7] },
        { label: "column-menu.tsx", code: menuSnippet, highlight: [2, 6, 7, 8] },
        { label: "resizing.tsx", code: sizingSnippet, highlight: [2, 4, 9, 10, 11] },
      ]}
      takeaways={[
        <><code>row.getVisibleCells()</code> is why hiding a column needs zero changes in the body markup.</>,
        <><code>enableHiding: false</code> on the name column - some columns must never disappear.</>,
        <>Column order is an array of ids, so drag and drop is a library away (dnd-kit) but the table does not care how the array got reordered.</>,
        <>Persist <code>columnVisibility</code> and <code>columnOrder</code> to localStorage and users get their layout back. It is plain JSON.</>,
      ]}
    >
      <Controls className="flex-col items-stretch">
        <div className="flex flex-wrap gap-3">
          {table.getAllLeafColumns().map((column) => (
            <label
              key={column.id}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                !column.getCanHide() && "text-neutral-400",
              )}
            >
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                disabled={!column.getCanHide()}
                onChange={column.getToggleVisibilityHandler()}
              />
              {column.id}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs" variant="outline" onClick={() => table.toggleAllColumnsVisible(true)}>
            Show all
          </Button>
          <Button size="xs" variant="outline" onClick={() => setColumnOrder(allIds)}>
            Reset order
          </Button>
          <span className="text-xs text-neutral-500">
            use ◀ ▶ in the headers to reorder · drag the right edge of a header to resize
          </span>
        </div>
      </Controls>

      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }} className="relative">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="text-neutral-300 hover:text-neutral-700"
                      onClick={() => move(header.column.id, -1)}
                    >
                      ◀
                    </button>
                    <span className="truncate">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    <button
                      type="button"
                      className="text-neutral-300 hover:text-neutral-700"
                      onClick={() => move(header.column.id, 1)}
                    >
                      ▶
                    </button>
                  </div>
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    data-resizing={header.column.getIsResizing() || undefined}
                    className={cn(
                      "tbl-resizer absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none",
                      header.column.getIsResizing() ? "bg-blue-500" : "bg-neutral-300 hover:bg-neutral-400",
                    )}
                  />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="truncate">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <StateReadout label="columnVisibility / columnOrder" value={{ columnVisibility, columnOrder }} />
    </Lesson>
  );
}

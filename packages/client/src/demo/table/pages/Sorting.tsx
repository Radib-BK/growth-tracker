import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type SortingFn,
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

/**
 * Custom comparator. The default alphanumeric sort would compare the date
 * strings character by character - which happens to work for ISO dates and
 * breaks the day you switch to "12/03/2019". Sort on the parsed value instead.
 */
const byDate: SortingFn<User> = (a, b, columnId) =>
  new Date(a.getValue<string>(columnId)).getTime() -
  new Date(b.getValue<string>(columnId)).getTime();

/** Business order, not alphabetical order. active < invited < suspended. */
const statusRank: Record<User["status"], number> = { active: 0, invited: 1, suspended: 2 };
const byStatus: SortingFn<User> = (a, b) =>
  statusRank[a.original.status] - statusRank[b.original.status];

const columns = [
  col.accessor((u) => fullName(u), { id: "name", header: "Name" }),
  col.accessor("department", { header: "Department" }),
  col.accessor("status", {
    header: "Status",
    cell: (c) => <StatusCell status={c.getValue()} />,
    sortingFn: byStatus,           // custom comparator
  }),
  col.accessor("salary", {
    header: "Salary",
    cell: (c) => <span className="tabular-nums">{money(c.getValue())}</span>,
    sortDescFirst: true,           // money almost always wants big-first
  }),
  col.accessor("projects", { header: "Projects", sortingFn: "basic" }),
  col.accessor("joinedAt", {
    header: "Joined",
    cell: (c) => shortDate(c.getValue()),
    sortingFn: byDate,
  }),
  col.accessor("email", {
    header: "Email",
    enableSorting: false,          // opt a single column out
  }),
];

const snippet = `const [sorting, setSorting] = useState<SortingState>([
  { id: "department", desc: false },
  { id: "salary", desc: true },        // multi sort = just more entries
]);

const table = useReactTable({
  data,
  columns,
  state: { sorting },                  // controlled: you own the state
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),   // <- without this, nothing sorts
  enableMultiSort: true,
  maxMultiSortColCount: 3,
});`;

const columnSnippet = `// Built in comparators: "alphanumeric", "alphanumericCaseSensitive",
// "text", "textCaseSensitive", "datetime", "basic".
// TanStack guesses one from the first row's value - override when it guesses wrong.

const byDate: SortingFn<User> = (a, b, columnId) =>
  new Date(a.getValue<string>(columnId)).getTime() -
  new Date(b.getValue<string>(columnId)).getTime();

const statusRank = { active: 0, invited: 1, suspended: 2 };
const byStatus: SortingFn<User> = (a, b) =>
  statusRank[a.original.status] - statusRank[b.original.status];

col.accessor("joinedAt", { header: "Joined", sortingFn: byDate })
col.accessor("status",   { header: "Status", sortingFn: byStatus })
col.accessor("salary",   { header: "Salary", sortDescFirst: true })
col.accessor("email",    { header: "Email",  enableSorting: false })`;

const headerSnippet = `<th
  colSpan={header.colSpan}
  onClick={header.column.getToggleSortingHandler()}   // handles shift-click too
  className={header.column.getCanSort() ? "cursor-pointer" : ""}
>
  {flexRender(header.column.columnDef.header, header.getContext())}

  {/* getIsSorted() -> false | "asc" | "desc" */}
  {{ asc: "▲", desc: "▼" }[header.column.getIsSorted() as string] ?? null}

  {/* which position this column holds in a multi sort */}
  {header.column.getSortIndex() > -1 && header.column.getSortIndex() + 1}
</th>`;

export default function Sorting() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "department", desc: false }]);

  const table = useReactTable({
    data: flatUsers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
    maxMultiSortColCount: 3,
  });

  const rows = table.getRowModel().rows.slice(0, 12);

  return (
    <Lesson
      title="Sorting"
      tagline="Sorting is one piece of state - an array - plus one row model. The array order is the sort priority, so multi column sorting is not a separate feature, it is just a longer array. Shift-click a header to add to it."
      snippets={[
        { label: "useReactTable.ts", code: snippet, highlight: [1, 2, 3, 4, 10, 11, 12] },
        { label: "sortingFn.ts", code: columnSnippet, highlight: [5, 6, 7, 9, 10, 11] },
        { label: "header.tsx", code: headerSnippet, highlight: [3, 9, 12] },
      ]}
      takeaways={[
        <>No <code>getSortedRowModel()</code>, no sorting. The row models are opt-in so you never ship code you did not use.</>,
        <><b>Shift-click</b> a second header - watch the state array grow and the badges number themselves.</>,
        <>Sorting compares the <i>accessor</i> value. Dates kept as strings and enums with a business order both need a <code>sortingFn</code>.</>,
        <><code>sortDescFirst</code>, <code>enableSorting</code>, <code>sortUndefined</code> and <code>invertSorting</code> are per column - reach for them before writing a comparator.</>,
      ]}
    >
      <Controls>
        <Button size="sm" variant="outline" onClick={() => setSorting([])} disabled={!sorting.length}>
          Clear sorting
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSorting([{ id: "department", desc: false }, { id: "salary", desc: true }])}
        >
          Preset: department ↑ then salary ↓
        </Button>
        <span className="text-xs text-neutral-500">
          shift-click headers to stack up to {3} sorts
        </span>
      </Controls>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const index = header.column.getSortIndex();
                return (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      "select-none",
                      header.column.getCanSort()
                        ? "cursor-pointer hover:text-neutral-900"
                        : "cursor-not-allowed text-neutral-400",
                      sorted && "bg-blue-50 text-blue-800",
                    )}
                    title={
                      header.column.getCanSort()
                        ? "click to sort, shift-click to add to the sort"
                        : "enableSorting: false"
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className={cn("text-[10px]", !sorted && "tbl-sort-hint")}>
                        {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : header.column.getCanSort() ? "↕" : ""}
                      </span>
                      {index > -1 && sorting.length > 1 && (
                        <span className="rounded bg-blue-600 px-1 text-[10px] text-white">{index + 1}</span>
                      )}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-neutral-500">Showing the first 12 of {flatUsers.length} sorted rows.</p>

      <StateReadout label="sorting state" value={sorting} />
    </Lesson>
  );
}

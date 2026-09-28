import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Lesson, Controls, Chip } from "@/demo/table/components/Lesson";
import { flatUsers, type User } from "@/demo/table/data/users";
import { StatusCell } from "@/demo/table/components/cells";
import { money } from "@/demo/table/components/format";

const columns: ColumnDef<User>[] = [
  { accessorKey: "firstName", header: "First name" },
  { accessorKey: "lastName", header: "Last name" },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "status", header: "Status", cell: (c) => <StatusCell status={c.getValue<User["status"]>()} /> },
  { accessorKey: "salary", header: "Salary", cell: (c) => money(c.getValue<number>()) },
];

/** The naive version everybody writes first. Works, until it has to do anything. */
function HandRolledTable() {
  const [query, setQuery] = useState("");
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = flatUsers.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => (asc ? a.salary - b.salary : b.salary - a.salary)).slice(0, 8);
  }, [query, asc]);

  return (
    <div className="space-y-3">
      <Controls>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search (3 fields, hand written)"
          className="h-8 w-64"
        />
        <Button size="sm" variant="outline" onClick={() => setAsc((v) => !v)}>
          salary {asc ? "asc" : "desc"}
        </Button>
      </Controls>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Salary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.firstName} {u.lastName}</TableCell>
              <TableCell>{u.department}</TableCell>
              <TableCell>{money(u.salary)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Same two features, but they are configuration now, not code. */
function HeadlessTable() {
  const table = useReactTable({
    data: flatUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  return (
    <div className="space-y-3">
      <Controls>
        <Input
          value={table.getState().globalFilter ?? ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          placeholder="search (every column, for free)"
          className="h-8 w-64"
        />
        <span className="text-xs text-neutral-500">
          click any header to sort - and it paginates too
        </span>
      </Controls>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer select-none hover:text-neutral-900"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted() as string] ?? ""}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableEmpty colSpan={columns.length} />
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Prev
        </Button>
        <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
        page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ·{" "}
        {table.getFilteredRowModel().rows.length} matching rows
      </div>
    </div>
  );
}

const headlessSnippet = `// Headless: the library owns the state and the maths.
// You still own every single DOM element.
const table = useReactTable({
  data: flatUsers,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),      // sorting
  getFilteredRowModel: getFilteredRowModel(),  // search + column filters
  getPaginationRowModel: getPaginationRowModel(), // paging
  initialState: { pagination: { pageSize: 8 } },
});

// Rendering is a boring double loop, and it never changes,
// no matter how many features you switch on above.
<tbody>
  {table.getRowModel().rows.map((row) => (
    <tr key={row.id}>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  ))}
</tbody>`;

const handRolledSnippet = `// Hand rolled: every feature is another useMemo and another useState.
const [query, setQuery] = useState("");
const [asc, setAsc] = useState(true);

const rows = useMemo(() => {
  const q = query.toLowerCase();
  const filtered = flatUsers.filter((u) =>
    u.firstName.toLowerCase().includes(q) ||
    u.lastName.toLowerCase().includes(q) ||
    u.department.toLowerCase().includes(q));
  return [...filtered]
    .sort((a, b) => (asc ? a.salary - b.salary : b.salary - a.salary))
    .slice(0, 8);
}, [query, asc]);

// Now add: sort by any column. Multi sort. Per column filters.
// Hidden columns. Frozen columns. Expandable rows. Selection.
// Each one touches this same block, and they interact with each other.`;

export default function Intro() {
  return (
    <Lesson
      title="Why not just write a <table>?"
      tagline="TanStack Table is headless: it ships zero markup and zero CSS. It is a state machine that takes your data and your column definitions and hands back rows that are already sorted, filtered, paged, grouped and pinned. You do the rendering, it does the bookkeeping."
      snippets={[
        { label: "hand-rolled.tsx", code: handRolledSnippet, highlight: [6, 7, 8, 9, 10, 11, 12, 13, 14] },
        { label: "headless.tsx", code: headlessSnippet, highlight: [3, 4, 5, 6, 7, 8, 9, 10] },
      ]}
      takeaways={[
        <>Headless means <b>no styling to fight</b>. This table is your own markup and your own Tailwind.</>,
        <>Features compose. Turning on sorting does not break filtering, because they are separate row models applied in a fixed order.</>,
        <>The whole API is one hook plus <code>flexRender</code>. Everything else is configuration.</>,
      ]}
    >
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Chip tone="red">Before</Chip> hand written filtering and sorting
        </h2>
        <HandRolledTable />
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Chip tone="green">After</Chip> the same data through useReactTable
        </h2>
        <HeadlessTable />
      </section>
    </Lesson>
  );
}

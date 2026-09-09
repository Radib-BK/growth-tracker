import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Lesson, Controls, StateReadout, Chip } from "@/demo/table/components/Lesson";
import { flatUsers, fullName, type User } from "@/demo/table/data/users";
import { StatusCell } from "@/demo/table/components/cells";
import { money } from "@/demo/table/components/format";

const col = createColumnHelper<User>();

/** A checkbox that can also be half filled - indeterminate is a DOM property. */
function Check({
  checked,
  indeterminate,
  ...rest
}: { checked: boolean; indeterminate?: boolean } & React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = Boolean(indeterminate) && !checked;
      }}
      className="size-4 accent-blue-600"
      {...rest}
    />
  );
}

const columns = [
  // Selection is a display column: no data, pure UI, and it must not be sorted.
  col.display({
    id: "select",
    size: 40,
    header: ({ table }) => (
      <Check
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Check
        checked={row.getIsSelected()}
        indeterminate={row.getIsSomeSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),
  col.accessor((u) => fullName(u), { id: "name", header: "Name" }),
  col.accessor("email", { header: "Email" }),
  col.accessor("department", { header: "Department" }),
  col.accessor("status", { header: "Status", cell: (c) => <StatusCell status={c.getValue()} /> }),
  col.accessor("salary", {
    header: "Salary",
    cell: (c) => <span className="tabular-nums">{money(c.getValue())}</span>,
  }),
];

const snippet = `const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

const table = useReactTable({
  data,
  columns,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
  getRowId: (user) => String(user.id),   // <- do this. see the takeaways.
  enableRowSelection: (row) => row.original.status !== "suspended",
  getCoreRowModel: getCoreRowModel(),
});

// rowSelection is { [rowId]: true } - nothing more:
// { "12": true, "31": true }

table.getSelectedRowModel().rows      // the actual Row objects
  .map((r) => r.original);            // ... and your User objects back

table.getIsAllPageRowsSelected();     // this page only
table.getIsAllRowsSelected();         // every filtered row
table.resetRowSelection();`;

const checkboxSnippet = `// Selection is a DISPLAY column - no accessor, so it never sorts or filters.
col.display({
  id: "select",
  header: ({ table }) => (
    <Check
      checked={table.getIsAllPageRowsSelected()}
      indeterminate={table.getIsSomePageRowsSelected()}   // the half state
      onChange={table.getToggleAllPageRowsSelectedHandler()}
    />
  ),
  cell: ({ row }) => (
    <Check
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}          // enableRowSelection said no
      onChange={row.getToggleSelectedHandler()}
    />
  ),
})

// indeterminate is a DOM property, not an attribute - set it on the ref:
ref={(el) => { if (el) el.indeterminate = someButNotAll; }}`;

export default function Selection() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: flatUsers,
    columns,
    state: { rowSelection, globalFilter },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getRowId: (user) => String(user.id),
    enableRowSelection: (row) => row.original.status !== "suspended",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const payroll = selected.reduce((sum, u) => sum + u.salary, 0);

  return (
    <Lesson
      title="Row selection"
      tagline="One object of row ids, and every checkbox in the table reads from it. The interesting parts are the half-selected header checkbox, the difference between this page and all pages, and why getRowId is not optional."
      snippets={[
        { label: "selection.ts", code: snippet, highlight: [7, 8, 9, 14, 15] },
        { label: "checkbox-column.tsx", code: checkboxSnippet, highlight: [2, 3, 5, 6, 7] },
      ]}
      takeaways={[
        <><b>Search for something, select rows, then clear the search.</b> The selection is still there - it is keyed by id, not by position.</>,
        <>Without <code>getRowId</code> the keys are <code>"0"</code>, <code>"1"</code>, <code>"2"</code>… so sorting silently reassigns your selection to different people.</>,
        <><code>enableRowSelection</code> takes a predicate - suspended users cannot be picked here, and their checkbox disables itself.</>,
        <>Header checkbox: <code>…AllPageRows…</code> for the visible page, <code>…AllRows…</code> for everything that survived filtering. Pick deliberately.</>,
      ]}
    >
      <Controls>
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="filter, then clear it - selection survives"
          className="h-8 w-72"
        />
        <Chip tone="blue">{selected.length} selected</Chip>
        <Chip tone="green">payroll {money(payroll)}</Chip>
        <Button size="sm" variant="outline" onClick={() => table.toggleAllRowsSelected(true)}>
          Select all {table.getFilteredRowModel().rows.length} filtered
        </Button>
        <Button size="sm" variant="outline" onClick={() => table.resetRowSelection()} disabled={!selected.length}>
          Clear
        </Button>
        <Button size="sm" variant="destructive" disabled={!selected.length}>
          Deactivate {selected.length || ""}
        </Button>
      </Controls>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.column.getSize() }}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-selected={row.getIsSelected()}
              className={!row.getCanSelect() ? "opacity-60" : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</Button>
        <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</Button>
        page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
      </div>

      <StateReadout label="rowSelection state (keyed by user id)" value={rowSelection} />
    </Lesson>
  );
}

import { Fragment, useState, type CSSProperties } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ExpandedState,
  type FilterFn,
  type RowSelectionState,
  type SortingFn,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Lesson, Controls, Chip } from "@/demo/table/components/Lesson";
import { users, fullName, type User } from "@/demo/table/data/users";
import { PersonCell, StatusCell } from "@/demo/table/components/cells";
import { money, shortDate } from "@/demo/table/components/format";

const col = createColumnHelper<User>();

const isOneOf: FilterFn<User> = (row, columnId, value: string[]) =>
  value.length === 0 || value.includes(row.getValue<string>(columnId));

const byDate: SortingFn<User> = (a, b, columnId) =>
  new Date(a.getValue<string>(columnId)).getTime() -
  new Date(b.getValue<string>(columnId)).getTime();

const searchEverything: FilterFn<User> = (row, _id, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const u = row.original;
  return [fullName(u), u.email, u.department, u.role, u.country, u.city]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

/** Everything from the previous nine lessons, in one column definition. */
const columns = [
  col.display({
    id: "select",
    size: 44,
    header: ({ table }) => (
      <input
        type="checkbox"
        className="size-4 accent-blue-600"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="size-4 accent-blue-600"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),

  col.group({
    id: "person",
    header: "Person",
    columns: [
      col.accessor((u) => fullName(u), {
        id: "name",
        header: "Name",
        size: 250,
        enableHiding: false,
        cell: ({ row }) => (
          <div style={{ paddingLeft: row.depth * 18 }} className="flex items-center gap-1.5">
            {row.getCanExpand() ? (
              <button
                type="button"
                onClick={row.getToggleExpandedHandler()}
                className="grid size-5 shrink-0 place-items-center rounded border text-[10px] hover:bg-neutral-100"
              >
                {row.getIsExpanded() ? "▾" : "▸"}
              </button>
            ) : (
              <span className="size-5 shrink-0" />
            )}
            <PersonCell user={row.original} />
          </div>
        ),
      }),
      col.accessor("role", { header: "Role", size: 110, filterFn: isOneOf }),
    ],
  }),

  col.group({
    id: "placement",
    header: "Placement",
    columns: [
      col.accessor("department", { header: "Department", size: 140, filterFn: isOneOf }),
      col.accessor("country", { header: "Country", size: 130 }),
      col.accessor("city", { header: "City", size: 130 }),
    ],
  }),

  col.group({
    id: "employment",
    header: "Employment",
    columns: [
      col.accessor("salary", {
        header: "Salary",
        size: 130,
        sortDescFirst: true,
        cell: (c) => <span className="block text-right tabular-nums">{money(c.getValue())}</span>,
      }),
      col.accessor("projects", { header: "Projects", size: 100 }),
      col.accessor("joinedAt", {
        header: "Joined",
        size: 130,
        sortingFn: byDate,
        cell: (c) => shortDate(c.getValue()),
      }),
    ],
  }),

  col.accessor("status", {
    header: "Status",
    size: 120,
    filterFn: isOneOf,
    cell: (c) => <StatusCell status={c.getValue()} />,
  }),
];

function pinStyles(column: Column<User, unknown>): CSSProperties {
  const pinned = column.getIsPinned();
  if (!pinned) return { width: column.getSize() };
  return {
    width: column.getSize(),
    position: "sticky",
    left: pinned === "left" ? column.getStart("left") : undefined,
    right: pinned === "right" ? column.getAfter("right") : undefined,
    zIndex: 2,
  };
}

const snippet = `// One hook. Ten features. Notice that nothing here is a special case -
// every feature is (a) some state, (b) a row model, (c) a few options.
const table = useReactTable({
  data: users,
  columns,
  state: {
    sorting, columnFilters, globalFilter, columnVisibility,
    columnPinning, rowSelection, expanded, pagination,
  },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onGlobalFilterChange: setGlobalFilter,
  onColumnVisibilityChange: setColumnVisibility,
  onColumnPinningChange: setColumnPinning,
  onRowSelectionChange: setRowSelection,
  onExpandedChange: setExpanded,
  onPaginationChange: setPagination,

  globalFilterFn: searchEverything,
  getSubRows: (u) => u.reports,
  getRowId: (u) => String(u.id),
  enableRowSelection: (row) => row.original.status !== "suspended",
  columnResizeMode: "onChange",

  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
});`;

const pipelineSnippet = `// The pipeline, in order. Each row model wraps the previous one,
// which is exactly why the numbers in the footer are always consistent.
//
//   data
//     -> getCoreRowModel        one Row per item, ids assigned
//     -> getFilteredRowModel    global filter AND every column filter
//     -> getSortedRowModel      the sorting array, in priority order
//     -> getGroupedRowModel     optional
//     -> getExpandedRowModel    sub rows folded in
//     -> getPaginationRowModel  the slice you finally render
//
// and the escape hatches, when a server owns a step:
//   manualFiltering / manualSorting / manualPagination
//
// Reading the result:
table.getRowModel().rows          // what you render right now
table.getFilteredRowModel().rows  // everything that matched
table.getPreFilteredRowModel()    // before filters - good for "3 of 55"
table.getSelectedRowModel().rows`;

export default function KitchenSink() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "salary", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ city: false });
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["select", "name"],
    right: ["status"],
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting, columnFilters, globalFilter, columnVisibility,
      columnPinning, rowSelection, expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,

    globalFilterFn: searchEverything,
    getSubRows: (u) => u.reports,
    getRowId: (u) => String(u.id),
    enableRowSelection: (row) => row.original.status !== "suspended",
    columnResizeMode: "onChange",

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const selectedCount = table.getSelectedRowModel().rows.length;
  const deptColumn = table.getColumn("department")!;
  const deptFilter = (deptColumn.getFilterValue() as string[] | undefined) ?? [];

  return (
    <Lesson
      title="Kitchen sink"
      tagline="Grouped headers, sorting, search, faceted filters, paging, hidden and frozen columns, resizing, expandable sub rows and selection - one useReactTable call, one <table>, 55 rows from a local file."
      snippets={[
        { label: "useReactTable.ts", code: snippet, highlight: [6, 7, 8, 9, 25, 26, 27, 28, 29, 30, 31] },
        { label: "pipeline.md", code: pipelineSnippet, highlight: [5, 6, 7, 8, 9, 10, 11] },
      ]}
      takeaways={[
        <>Every feature was independent state. Put together, they still are - which is why this table is not harder to reason about than the single feature ones.</>,
        <>Row models are middleware. The order is fixed and it explains every "why is my count wrong" question.</>,
        <>Serialise this state object into the URL and you have shareable, bookmarkable table views for free.</>,
        <>Next steps for a real app: <code>@tanstack/react-virtual</code> for tens of thousands of rows, and <code>manual*</code> flags when the server should do the work.</>,
      ]}
    >
      <Controls className="flex-col items-stretch gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search everything…"
            className="h-8 w-72"
          />
          <Chip tone="blue">
            {table.getFilteredRowModel().rows.length} of {table.getPreFilteredRowModel().rows.length} rows
          </Chip>
          {selectedCount > 0 && <Chip tone="green">{selectedCount} selected</Chip>}
          <Button size="xs" variant="outline" onClick={() => table.toggleAllRowsExpanded()}>
            {table.getIsAllRowsExpanded() ? "Collapse" : "Expand"} all
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              setGlobalFilter("");
              setSorting([]);
              table.resetColumnFilters();
              table.resetRowSelection();
            }}
          >
            Reset
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-neutral-500">department:</span>
          {[...deptColumn.getFacetedUniqueValues().keys()].sort().map((value) => {
            const on = deptFilter.includes(value as string);
            return (
              <button
                key={String(value)}
                type="button"
                onClick={() =>
                  deptColumn.setFilterValue(
                    on ? deptFilter.filter((v) => v !== value) : [...deptFilter, value],
                  )
                }
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[11px]",
                  on ? "border-blue-500 bg-blue-50 text-blue-800" : "border-neutral-200 text-neutral-600",
                )}
              >
                {String(value)}
              </button>
            );
          })}
          <span className="ml-3 text-[11px] text-neutral-500">columns:</span>
          {table.getAllLeafColumns().filter((c) => c.getCanHide()).map((column) => (
            <label key={column.id} className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={column.getToggleVisibilityHandler()}
              />
              {column.id}
            </label>
          ))}
        </div>
      </Controls>

      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const isLeafHeader = !header.isPlaceholder && header.subHeaders.length === 0;
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={pinStyles(header.column)}
                    data-pinned={header.column.getIsPinned() || undefined}
                    className={cn(
                      "relative truncate",
                      header.colSpan > 1 && "border-r text-center",
                      sorted && "text-blue-800",
                      header.column.getCanSort() && "cursor-pointer select-none",
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="text-[10px]">
                          {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : ""}
                        </span>
                      </span>
                    )}
                    {isLeafHeader && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onClick={(e) => e.stopPropagation()}
                        data-resizing={header.column.getIsResizing() || undefined}
                        className={cn(
                          "tbl-resizer absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none",
                          header.column.getIsResizing() ? "bg-blue-500" : "bg-neutral-300",
                        )}
                      />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableEmpty colSpan={table.getVisibleLeafColumns().length} />
          ) : (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  data-selected={row.getIsSelected()}
                  className={cn(row.depth > 0 && "[&>td]:bg-neutral-50/60")}
                >
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
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
        <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹ Prev</Button>
        <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next ›</Button>
        <span>
          page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <select
          className="h-8 rounded-md border px-2"
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[8, 15, 25].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
        <span className="text-neutral-400">
          Name and the checkbox are frozen left, Status frozen right - scroll sideways.
        </span>
      </div>
    </Lesson>
  );
}

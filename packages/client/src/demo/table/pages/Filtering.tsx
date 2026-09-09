import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type FilterFn,
  type Column,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Lesson, Controls, StateReadout, Chip } from "@/demo/table/components/Lesson";
import { flatUsers, fullName, type User } from "@/demo/table/data/users";
import { StatusCell } from "@/demo/table/components/cells";
import { money } from "@/demo/table/components/format";

const col = createColumnHelper<User>();

/** Multi select filter: the filter value is an array of allowed values. */
const isOneOf: FilterFn<User> = (row, columnId, value: string[]) =>
  value.length === 0 || value.includes(row.getValue<string>(columnId));

/** Range filter: the filter value is a [min, max] tuple. */
const inRange: FilterFn<User> = (row, columnId, [min, max]: [number, number]) => {
  const v = row.getValue<number>(columnId);
  return v >= min && v <= max;
};

/**
 * Global filter runs once per row against every column you let it see.
 * Returning a boolean is all it has to do.
 */
const searchEverything: FilterFn<User> = (row, _columnId, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const u = row.original;
  return [fullName(u), u.email, u.department, u.role, u.country, u.city, u.notes ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

const columns = [
  col.accessor((u) => fullName(u), { id: "name", header: "Name" }),
  col.accessor("email", { header: "Email" }),
  col.accessor("department", { header: "Department", filterFn: isOneOf }),
  col.accessor("role", { header: "Role", filterFn: isOneOf }),
  col.accessor("status", {
    header: "Status",
    cell: (c) => <StatusCell status={c.getValue()} />,
    filterFn: isOneOf,
  }),
  col.accessor("salary", {
    header: "Salary",
    cell: (c) => <span className="tabular-nums">{money(c.getValue())}</span>,
    filterFn: inRange,
  }),
  col.accessor("city", { header: "City", filterFn: "includesString" }),
];

const snippet = `const [globalFilter, setGlobalFilter] = useState("");
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

const table = useReactTable({
  data,
  columns,
  state: { globalFilter, columnFilters },
  onGlobalFilterChange: setGlobalFilter,
  onColumnFiltersChange: setColumnFilters,
  globalFilterFn: searchEverything,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),   // required for both filters
  // facets = "what values actually exist in this column", used to build
  // the dropdown options without hand maintaining a list
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getFacetedMinMaxValues: getFacetedMinMaxValues(),   // [min, max] per column
});

// columnFilters is just an array:
// [{ id: "department", value: ["Design", "Sales"] },
//  { id: "salary",     value: [90000, 150000] }]`;

const filterFnSnippet = `// Built ins: "includesString", "equalsString", "arrIncludes",
// "arrIncludesAll", "arrIncludesSome", "equals", "weakEquals", "inNumberRange".

// Anything else is a two line function. Return true to keep the row.
const isOneOf: FilterFn<User> = (row, columnId, value: string[]) =>
  value.length === 0 || value.includes(row.getValue<string>(columnId));

const inRange: FilterFn<User> = (row, columnId, [min, max]: [number, number]) => {
  const v = row.getValue<number>(columnId);
  return v >= min && v <= max;
};

col.accessor("department", { filterFn: isOneOf })
col.accessor("salary",     { filterFn: inRange })
col.accessor("city",       { filterFn: "includesString" })

// driving it from the UI
column.setFilterValue(["Design"]);   // set
column.getFilterValue();             // read
column.setFilterValue(undefined);    // clear this one
table.resetColumnFilters();          // clear all`;

const facetSnippet = `// The options in the Department dropdown are not hard coded.
// getFacetedUniqueValues() returns a Map<value, count> for the rows
// that survive every OTHER filter - so counts stay honest.
const facets = column.getFacetedUniqueValues();

[...facets.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([value, count]) => (
    <label key={value}>
      <input type="checkbox" checked={selected.includes(value)} />
      {value} <span>{count}</span>
    </label>
  ));

// The salary slider's bounds work the same way - no magic numbers:
const [min, max] = column.getFacetedMinMaxValues() ?? [0, 0];

<input
  type="range"
  min={min}                                  // from the data
  max={max}                                  // from the data
  value={selectedMin}
  onChange={(e) => column.setFilterValue([Number(e.target.value), max])}
/>

// Note it returns undefined until the row model has run, so always
// default it. And it needs getFacetedRowModel() registered too.`;

/**
 * Takes plain arrays, not the Column object.
 *
 * A Column (like the table instance itself) is referentially stable across
 * renders, so a memoizing compiler would never re-render this and the chips
 * would stop reacting to clicks. Hand child components derived values.
 */
function FacetFilter({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: [string, number][];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="rounded-md border bg-white p-2">
      <div className="mb-1 text-[11px] font-semibold text-neutral-600">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map(([value, count]) => {
          const on = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={cn(
                "rounded border px-1.5 py-0.5 text-[11px]",
                on
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
              )}
            >
              {value} <span className="text-neutral-400">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** getFacetedUniqueValues() -> Map<value, count>, most common first. */
function facetProps(column: Column<User, unknown>) {
  const selected = (column.getFilterValue() as string[] | undefined) ?? [];
  const options = ([...column.getFacetedUniqueValues().entries()] as [string, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const onToggle = (value: string) =>
    column.setFilterValue(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  return { options, selected, onToggle };
}

export default function Filtering() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: flatUsers,
    columns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: searchEverything,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  // The slider bounds come from the data, not from a number I typed. Add a
  // 300k salary to users.ts and the track stretches on its own.
  const salaryColumn = table.getColumn("salary")!;
  const [salaryMin, salaryMax] = salaryColumn.getFacetedMinMaxValues() ?? [0, 0];
  const [selectedMin] = (salaryColumn.getFilterValue() as [number, number] | undefined) ?? [
    salaryMin,
    salaryMax,
  ];
  const rows = table.getRowModel().rows;

  return (
    <Lesson
      title="Filtering and search"
      tagline="Two independent things share one row model. A global filter runs once per row and is your search box. Column filters are an array of {id, value} entries, each handed to that column's filterFn. Facets tell you which values exist so the dropdowns build themselves."
      snippets={[
        { label: "useReactTable.ts", code: snippet, highlight: [7, 8, 9, 10, 12, 15, 16] },
        { label: "filterFn.ts", code: filterFnSnippet, highlight: [5, 6, 8, 9, 10, 11] },
        { label: "facets.tsx", code: facetSnippet, highlight: [4, 6, 7, 8] },
      ]}
      takeaways={[
        <>Search and column filters are <b>ANDed</b>. The row survives only if the global filter and every column filter say yes.</>,
        <>A <code>filterFn</code> is just <code>(row, columnId, value) =&gt; boolean</code>. Multi select and range filters are three lines each.</>,
        <>Facet counts come from the rows that pass the <i>other</i> filters, so the numbers next to each option are the real remaining counts.</>,
        <>Filtering runs before pagination, which is why the page count changes as you type.</>,
      ]}
    >
      <Controls className="flex-col items-stretch gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search name, email, department, city, notes…"
            className="h-8 w-80"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setGlobalFilter("");
              table.resetColumnFilters();
            }}
          >
            Reset all
          </Button>
          <Chip tone="blue">
            {rows.length} of {flatUsers.length} rows
          </Chip>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <FacetFilter label="Department (faceted)" {...facetProps(table.getColumn("department")!)} />
          <FacetFilter label="Role (faceted)" {...facetProps(table.getColumn("role")!)} />
          <FacetFilter label="Status (faceted)" {...facetProps(table.getColumn("status")!)} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-md border bg-white p-2">
            <div className="mb-1 text-[11px] font-semibold text-neutral-600">
              Minimum salary (range filterFn): {money(selectedMin)}
              <span className="ml-1 font-normal text-neutral-400">
                data range {money(salaryMin)} – {money(salaryMax)}
              </span>
            </div>
            <input
              type="range"
              min={salaryMin}
              max={salaryMax}
              step={1000}
              value={selectedMin}
              onChange={(e) => salaryColumn.setFilterValue([Number(e.target.value), salaryMax])}
              className="w-64"
            />
          </div>
          <div className="rounded-md border bg-white p-2">
            <div className="mb-1 text-[11px] font-semibold text-neutral-600">
              City (includesString)
            </div>
            <Input
              className="h-7 w-48"
              placeholder="type a city…"
              value={(table.getColumn("city")!.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("city")!.setFilterValue(e.target.value)}
            />
          </div>
        </div>
      </Controls>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id} className={header.column.getIsFiltered() ? "bg-blue-50 text-blue-800" : ""}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={columns.length} />
          ) : (
            rows.slice(0, 12).map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <p className="text-xs text-neutral-500">Showing at most 12 matching rows - paging comes next.</p>

      <StateReadout label="columnFilters state" value={{ globalFilter, columnFilters }} />
    </Lesson>
  );
}

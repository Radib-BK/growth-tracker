import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Lesson } from "@/demo/table/components/Lesson";
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


/**
 * A group column has no accessor - it only has `columns`. TanStack builds a
 * header tree from that nesting and hands you one header group per level.
 * colSpan falls out of the tree automatically. rowSpan does NOT - see below.
 */
const columns = [
  col.group({
    id: "identity",
    header: () => <GroupLabel tone="sky">Identity</GroupLabel>,
    columns: [
      col.accessor((u) => fullName(u), { id: "name", header: "Name" }),
      col.accessor("email", { header: "Email" }),
    ],
  }),
  col.group({
    id: "placement",
    header: () => <GroupLabel tone="violet">Placement</GroupLabel>,
    columns: [
      col.accessor("department", { header: "Department" }),
      col.accessor("role", { header: "Role" }),
      col.group({
        id: "location",
        header: () => <GroupLabel tone="violet">Location</GroupLabel>,
        columns: [
          col.accessor("country", { header: "Country" }),
          col.accessor("city", { header: "City" }),
        ],
      }),
    ],
  }),
  col.group({
    id: "employment",
    header: () => <GroupLabel tone="emerald">Employment</GroupLabel>,
    columns: [
      col.accessor("salary", {
        header: "Salary",
        cell: (c) => <span className="tabular-nums">{money(c.getValue())}</span>,
      }),
      col.accessor("joinedAt", { header: "Joined", cell: (c) => shortDate(c.getValue()) }),
    ],
  }),
  // A leaf at the top level, sitting next to three groups. It has nothing to
  // put in the first header row, so TanStack emits a *placeholder* header
  // there - that is what header.isPlaceholder means.
  col.accessor("status", {
    header: "Status",
    cell: (c) => <StatusCell status={c.getValue()} />,
  }),
];

function GroupLabel({ children, tone }: { children: string; tone: "sky" | "violet" | "emerald" }) {
  const tones = {
    sky: "text-sky-700",
    violet: "text-violet-700",
    emerald: "text-emerald-700",
  } as const;
  return <span className={cn("text-[11px] font-semibold tracking-wide uppercase", tones[tone])}>{children}</span>;
}

const snippet = `const col = createColumnHelper<User>();

const columns = [
  // A GROUP column: no accessor, only children.
  col.group({
    id: "identity",
    header: "Identity",
    columns: [
      col.accessor("name",  { header: "Name" }),
      col.accessor("email", { header: "Email" }),
    ],
  }),
  col.group({
    id: "placement",
    header: "Placement",
    columns: [
      col.accessor("department", { header: "Department" }),
      col.accessor("role",       { header: "Role" }),
      col.group({                       // groups nest as deep as you like
        id: "location",
        header: "Location",
        columns: [
          col.accessor("country", { header: "Country" }),
          col.accessor("city",    { header: "City" }),
        ],
      }),
    ],
  }),
  // a plain leaf sitting next to the groups - this is what creates
  // the placeholder headers in the rows above it
  col.accessor("status", { header: "Status" }),
];`;

const renderSnippet = `// getHeaderGroups() returns THREE arrays here, one per depth level.
// Every header already carries the colSpan worked out from the tree.
<thead>
  {table.getHeaderGroups().map((headerGroup) => (
    <tr key={headerGroup.id}>
      {headerGroup.headers.map((header) => (
        <th key={header.id} colSpan={header.colSpan}>
          {header.isPlaceholder
            ? null                          // <- the empty cells over "Status"
            : flexRender(header.column.columnDef.header, header.getContext())}
        </th>
      ))}
    </tr>
  ))}
</thead>

// Useful bits on a header:
//   header.colSpan          how many leaf columns sit underneath it
//   header.depth            which header row it lives in - 1 BASED, not 0
//   header.subHeaders       its children (a placeholder still has one)
//   header.isPlaceholder    true when a leaf column has nothing to show at
//                           this level - render null, but KEEP the cell
//   header.column.getLeafColumns()   every leaf under a group

// Two things that surprise people:
//
// 1. A leaf column's real header renders in the DEEPEST row, with
//    placeholders stacked above it. "Status" is not at the top of the
//    header block - it is at the bottom, under two empty cells.
//
// 2. header.rowSpan exists but is always 0 in v8. Do not render it.
//    Because every real leaf header already sits in the last row, its
//    rowSpan is 1 anyway, and the placeholders above fill the gap.
//    If you want "Status" to span all three rows instead, you render it
//    at its topmost placeholder yourself - that is your call, not the
//    library's.`;

export default function ColumnGroups() {
  const table = useReactTable({
    data: demoRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const depth = table.getHeaderGroups().length;

  return (
    <Lesson
      title="Column groups: nested headers and colSpan"
      tagline="Nest columns inside a group column and the header stops being one row. TanStack turns the nesting into a header tree and gives every header its colSpan, its depth and a flag for the empty cells - you never count a span by hand."
      snippets={[
        { label: "grouped-columns.tsx", code: snippet, highlight: [4, 5, 6, 7, 8, 9, 10, 11] },
        { label: "render-header.tsx", code: renderSnippet, highlight: [7, 8, 9, 10, 24, 25, 26, 27, 28, 29] },
      ]}
      takeaways={[
        <><code>colSpan</code> is derived from how many leaf columns a group contains. Hide a child column and the span shrinks on its own.</>,
        <><code>isPlaceholder</code> is the bit people miss: a leaf next to a group still needs a cell at every level, it just renders nothing.</>,
        <>A leaf's real header sits in the <b>deepest</b> row with placeholders above it - which is why <code>Status</code> is at the bottom of the header block, not the top.</>,
        <><code>header.rowSpan</code> is always 0 in v8. Rendering it produces <code>rowspan="0"</code>, which HTML reads as "span to the end of the row group". Leave it off.</>,
        <>Group columns take part in visibility and pinning too - toggling a group toggles everything under it.</>,
      ]}
    >
      <p className="text-xs text-neutral-500">
        {depth} header rows from one nested column definition, and every span below was computed
        by the table. The tinted cells are the placeholders.
      </p>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "border-r last:border-r-0",
                      header.colSpan > 1 && "text-center",
                      header.isPlaceholder && "bg-neutral-100/60",
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="border-r whitespace-nowrap last:border-r-0">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Lesson>
  );
}

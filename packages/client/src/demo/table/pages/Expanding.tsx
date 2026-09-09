import { Fragment, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ExpandedState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Lesson, Controls, StateReadout, Chip } from "@/demo/table/components/Lesson";
import { users, fullName, type User } from "@/demo/table/data/users";
import { StatusCell } from "@/demo/table/components/cells";
import { money, shortDate } from "@/demo/table/components/format";

const col = createColumnHelper<User>();

const columns = [
  col.accessor((u) => fullName(u), {
    id: "name",
    header: "Name",
    // The indent and the chevron are yours to draw. row.depth tells you how
    // deep this row sits; getCanExpand() is true when it has sub rows.
    cell: ({ row, getValue }) => (
      <div style={{ paddingLeft: row.depth * 20 }} className="flex items-center gap-1.5">
        {row.getCanExpand() ? (
          <button
            type="button"
            onClick={row.getToggleExpandedHandler()}
            className="grid size-5 place-items-center rounded border text-[10px] text-neutral-600 hover:bg-neutral-100"
          >
            {row.getIsExpanded() ? "▾" : "▸"}
          </button>
        ) : (
          <span className="size-5" />
        )}
        <span className={row.depth === 0 ? "font-medium" : ""}>{getValue<string>()}</span>
        {row.subRows.length > 0 && (
          <span className="text-[10px] text-neutral-400">({row.subRows.length} reports)</span>
        )}
      </div>
    ),
  }),
  col.accessor("role", { header: "Role" }),
  col.accessor("department", { header: "Department" }),
  col.accessor("status", { header: "Status", cell: (c) => <StatusCell status={c.getValue()} /> }),
  col.accessor("salary", {
    header: "Salary",
    cell: (c) => <span className="tabular-nums">{money(c.getValue())}</span>,
  }),
];

const snippet = `const [expanded, setExpanded] = useState<ExpandedState>({});

const table = useReactTable({
  data: users,                     // a tree: managers with reports[]
  columns,
  state: { expanded },
  onExpandedChange: setExpanded,
  getSubRows: (user) => user.reports,   // <- turns flat props into a tree
  getRowId: (user) => String(user.id),  // stable ids, so expanded state survives
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),  // flattens the open branches
});

// expanded is either true (everything) or a map of row ids:
// { "1": true, "1.0": true }
table.toggleAllRowsExpanded();
table.getIsAllRowsExpanded();
table.resetExpanded();`;

const cellSnippet = `col.accessor("name", {
  cell: ({ row, getValue }) => (
    // indentation is yours to draw - the table only tells you the depth
    <div style={{ paddingLeft: row.depth * 20 }}>
      {row.getCanExpand() && (
        <button onClick={row.getToggleExpandedHandler()}>
          {row.getIsExpanded() ? "▾" : "▸"}
        </button>
      )}
      {getValue()}
    </div>
  ),
})

// row.depth              0 for top level, 1 for a report, ...
// row.subRows            the child Row objects
// row.getCanExpand()     has sub rows (or you forced it)
// row.getParentRow()     walk back up`;

const detailSnippet = `// The OTHER kind of expanding: a detail panel that is not a sub row.
// Force every row expandable, then render your own <tr> underneath.
const table = useReactTable({
  ...,
  getRowCanExpand: () => true,
});

{table.getRowModel().rows.map((row) => (
  <Fragment key={row.id}>
    <tr>{/* the normal cells */}</tr>

    {row.getIsExpanded() && (
      <tr>
        {/* one cell spanning the whole table - colSpan again */}
        <td colSpan={row.getVisibleCells().length}>
          <UserDetail user={row.original} />
        </td>
      </tr>
    )}
  </Fragment>
))}`;

function UserDetail({ user }: { user: User }) {
  return (
    <div className="grid gap-3 rounded-md border bg-neutral-50 p-3 text-xs sm:grid-cols-4">
      <Field label="Email" value={user.email} />
      <Field label="Location" value={`${user.city}, ${user.country}`} />
      <Field label="Joined" value={shortDate(user.joinedAt)} />
      <Field label="Last active" value={shortDate(user.lastActive)} />
      <Field label="Projects" value={String(user.projects)} />
      <div className="sm:col-span-3">
        <div className="text-[10px] tracking-wide text-neutral-400 uppercase">Notes</div>
        <div className="text-neutral-700">{user.notes ?? "—"}</div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-wide text-neutral-400 uppercase">{label}</div>
      <div className="text-neutral-700">{value}</div>
    </div>
  );
}

export default function Expanding() {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [mode, setMode] = useState<"subrows" | "detail">("subrows");

  const table = useReactTable({
    data: users,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getSubRows: (user) => user.reports,
    getRowId: (user) => String(user.id),
    getRowCanExpand: mode === "detail" ? () => true : undefined,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <Lesson
      title="Expanding rows"
      tagline="Two different jobs share one flag. Sub rows turn nested data into a tree the table can walk. A detail panel is a row you render yourself underneath, spanning every column. Both read from the same expanded state."
      snippets={[
        { label: "subrows.ts", code: snippet, highlight: [8, 9, 12] },
        { label: "expander-cell.tsx", code: cellSnippet, highlight: [4, 5, 6, 7, 8, 9] },
        { label: "detail-panel.tsx", code: detailSnippet, highlight: [5, 13, 14, 15, 16, 17] },
      ]}
      takeaways={[
        <><code>getSubRows</code> is the whole tree feature. One line, and rows nest as deep as your data does.</>,
        <>Set <code>getRowId</code>, otherwise expanded state keys are positional (<code>"0.1"</code>) and break the moment you sort.</>,
        <>The detail panel is not a table feature - it is your <code>&lt;tr&gt;</code> with <code>colSpan</code>. The table only lends you the open/closed bit.</>,
        <>Sub rows still get filtered and sorted. <code>filterFromLeafRows</code> and <code>paginateExpandedRows</code> control how they interact.</>,
      ]}
    >
      <Controls>
        <Button size="sm" variant={mode === "subrows" ? "default" : "outline"} onClick={() => setMode("subrows")}>
          Sub rows
        </Button>
        <Button size="sm" variant={mode === "detail" ? "default" : "outline"} onClick={() => setMode("detail")}>
          Detail panel
        </Button>
        <Button size="sm" variant="outline" onClick={() => table.toggleAllRowsExpanded()}>
          {table.getIsAllRowsExpanded() ? "Collapse all" : "Expand all"}
        </Button>
        <Chip tone="blue">{table.getRowModel().rows.length} visible rows</Chip>
        <span className="text-xs text-neutral-500">
          {mode === "subrows"
            ? "3 managers, 7 reports - one nested array in the data file"
            : "every row is expandable now, and opens a colSpan panel"}
        </span>
      </Controls>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Fragment key={row.id}>
              <TableRow className={cn(row.depth > 0 && "bg-neutral-50/60")}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>

              {mode === "detail" && row.getIsExpanded() && (
                <TableRow>
                  <TableCell colSpan={row.getVisibleCells().length} className="p-2">
                    <UserDetail user={row.original} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>

      <StateReadout label="expanded state" value={expanded} />
    </Lesson>
  );
}

import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
  type GroupingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Lesson, Controls, StateReadout } from "@/demo/table/components/Lesson";
import { flatUsers, fullName, type User } from "@/demo/table/data/users";
import { StatusCell } from "@/demo/table/components/cells";
import { money } from "@/demo/table/components/format";

const col = createColumnHelper<User>();

const columns = [
  col.accessor((u) => fullName(u), { id: "name", header: "Name", enableGrouping: false }),
  col.accessor("department", { header: "Department" }),
  col.accessor("role", { header: "Role" }),
  col.accessor("country", { header: "Country" }),
  col.accessor("status", {
    header: "Status",
    cell: (c) => <StatusCell status={c.getValue()} />,
    enableGrouping: false,
  }),
  col.accessor("salary", {
    header: "Salary",
    enableGrouping: false,
    aggregationFn: "mean",                 // what a group row shows
    cell: (c) => <span className="tabular-nums">{money(c.getValue())}</span>,
    aggregatedCell: (c) => (
      <span className="tabular-nums text-neutral-600">avg {money(Math.round(Number(c.getValue())))}</span>
    ),
  }),
  col.accessor("projects", {
    header: "Projects",
    enableGrouping: false,
    aggregationFn: "sum",
    aggregatedCell: (c) => <span className="tabular-nums text-neutral-600">Σ {String(c.getValue())}</span>,
  }),
];

const snippet = `const [grouping, setGrouping] = useState<GroupingState>(["department"]);

const table = useReactTable({
  data,
  columns,
  state: { grouping },
  onGroupingChange: setGrouping,
  getCoreRowModel: getCoreRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),   // group rows expand
});

// grouping is an array of column ids, and the ORDER is the nesting:
// ["department", "role"]  ->  department > role > people

// built in aggregations: sum, min, max, extent, mean, median,
// unique, uniqueCount, count - or your own (values) => result
col.accessor("salary", {
  aggregationFn: "mean",
  aggregatedCell: (c) => "avg " + money(c.getValue()),
})`;

const renderSnippet = `// Three kinds of cell now, and the row tells you which one to draw.
{row.getVisibleCells().map((cell) => (
  <td key={cell.id}>
    {cell.getIsGrouped() ? (
      // the cell that IS the group - value + how many rows under it
      <button onClick={row.getToggleExpandedHandler()}>
        {row.getIsExpanded() ? "▾" : "▸"}
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
        ({row.subRows.length})
      </button>
    ) : cell.getIsAggregated() ? (
      // a summary of the rows underneath
      flexRender(
        cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
        cell.getContext(),
      )
    ) : cell.getIsPlaceholder() ? null : (
      // an ordinary leaf cell
      flexRender(cell.column.columnDef.cell, cell.getContext())
    )}
  </td>
))}`;

export default function Grouping() {
  const [grouping, setGrouping] = useState<GroupingState>(["department"]);

  const table = useReactTable({
    data: flatUsers,
    columns,
    state: { grouping },
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const toggle = (id: string) =>
    setGrouping((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  return (
    <Lesson
      title="Grouping and aggregation"
      tagline="Pivot-table behaviour without a pivot table. Group by one or more columns and every other column can summarise the rows underneath it - sum, mean, count, or a function you write."
      snippets={[
        { label: "grouping.ts", code: snippet, highlight: [1, 9, 10, 13, 14] },
        { label: "cell-kinds.tsx", code: renderSnippet, highlight: [4, 5, 6, 11, 12, 17] },
      ]}
      takeaways={[
        <>The <code>grouping</code> array is the nesting order. Add <code>role</code> after <code>department</code> and you get two levels.</>,
        <>Grouping needs the expanded row model too - a group row is an expandable row.</>,
        <>A cell is now one of four things: grouped, aggregated, placeholder, or normal. That branch is the only new rendering code.</>,
        <>This is the feature that most often makes a designer's "can we get a summary row" a five minute job.</>,
      ]}
    >
      <Controls>
        <span className="text-xs text-neutral-500">group by:</span>
        {["department", "role", "country"].map((id) => (
          <Button
            key={id}
            size="xs"
            variant={grouping.includes(id) ? "default" : "outline"}
            onClick={() => toggle(id)}
          >
            {id}
            {grouping.includes(id) && (
              <span className="ml-1 opacity-70">{grouping.indexOf(id) + 1}</span>
            )}
          </Button>
        ))}
        <Button size="xs" variant="outline" onClick={() => table.toggleAllRowsExpanded()}>
          {table.getIsAllRowsExpanded() ? "Collapse all" : "Expand all"}
        </Button>
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
            <TableRow key={row.id} className={cn(row.getIsGrouped() && "bg-neutral-100/70 font-medium")}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="whitespace-nowrap">
                  {cell.getIsGrouped() ? (
                    <button
                      type="button"
                      onClick={row.getToggleExpandedHandler()}
                      className="flex items-center gap-1.5"
                    >
                      <span className="text-[10px]">{row.getIsExpanded() ? "▾" : "▸"}</span>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      <span className="text-[11px] font-normal text-neutral-500">
                        ({row.subRows.length})
                      </span>
                    </button>
                  ) : cell.getIsAggregated() ? (
                    flexRender(
                      cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                      cell.getContext(),
                    )
                  ) : cell.getIsPlaceholder() ? null : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <StateReadout label="grouping state" value={grouping} />
    </Lesson>
  );
}

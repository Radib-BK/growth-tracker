import { useMemo, useRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  makeManyUsers,
  fullName,
  currency,
  type User,
} from "@/demo/table/data/users";

const col = createColumnHelper<User>();

const columns = [
  col.accessor("id", { header: "#", size: 60 }),
  col.accessor((u) => fullName(u), { id: "name", header: "Name", size: 160 }),
  col.accessor("email", { header: "Email", size: 240 }),
  col.accessor("department", { header: "Department", size: 120 }),
  col.accessor("role", { header: "Role", size: 90 }),
  col.accessor("status", { header: "Status", size: 90 }),
  col.accessor("salary", {
    header: "Salary",
    size: 100,
    cell: (c) => currency.format(c.getValue()),
  }),
];

export default function Virtualization() {
  const data = useMemo(() => makeManyUsers(10_000), []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  // the element that actually scrolls - the virtualizer measures it
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 36,
    overscan: 5, // extra rows above/below, so scrolling isn't blank
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className="pb-15">
      <h1 className="text-2xl font-semibold">Virtualization</h1>
      <p className="max-w-160 text-sm text-neutral-500">
        {rows.length.toLocaleString()} rows in the table, only{" "}
        <b>{virtualRows.length}</b> <code>&lt;tr&gt;</code> in the DOM. TanStack
        Table gives you the full row model; TanStack Virtual decides which slice
        of it gets rendered.
      </p>

      {/* 1. a fixed height scroll container */}
      <div
        ref={scrollRef}
        className="h-100 overflow-auto border border-neutral-300 bg-white"
      >
        <table className="grid w-full text-[13px]">
          <thead className="sticky top-0 z-10 grid bg-neutral-100">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="flex w-full">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b border-neutral-300 px-2.5 py-2 text-left"
                    style={{ flex: `${header.getSize()} 0 0` }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* 2. the tbody is as tall as ALL rows would be, so the scrollbar is honest */}
          <tbody
            className="relative grid"
            style={{ height: rowVirtualizer.getTotalSize() }}
          >
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                /* 3. each visible row is absolutely positioned at its own offset */
                <tr
                  key={row.id}
                  className="absolute top-0 left-0 flex w-full"
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="truncate border-b border-neutral-200 px-2.5 py-2"
                      style={{ flex: `${cell.column.getSize()} 0 0` }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-400">
        Rendering rows {virtualRows[0]?.index ?? 0}–
        {virtualRows[virtualRows.length - 1]?.index ?? 0} · total height{" "}
        {rowVirtualizer.getTotalSize()}px
      </p>
    </div>
  );
}

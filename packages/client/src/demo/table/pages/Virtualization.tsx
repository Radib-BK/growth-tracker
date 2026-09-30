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
  // the same User shape as every other lesson, just 10.000 of them
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
    estimateSize: () => 36, // row height in px
    overscan: 5, // extra rows above/below, so scrolling isn't blank
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div style={{ paddingBottom: 60 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Virtualization</h1>
      <p style={{ maxWidth: 640, fontSize: 14, color: "#666" }}>
        {rows.length.toLocaleString()} rows in the table, only{" "}
        <b>{virtualRows.length}</b> <code>&lt;tr&gt;</code> in the DOM. TanStack
        Table gives you the full row model; TanStack Virtual decides which slice
        of it gets rendered.
      </p>

      {/* 1. a fixed height scroll container */}
      <div
        ref={scrollRef}
        style={{
          height: 400,
          overflow: "auto",
          border: "1px solid #ddd",
          background: "#fff",
        }}
      >
        {/* display:grid on the table/thead/tbody - once rows are flex and
            absolutely positioned, native table layout only gets in the way */}
        <table style={{ display: "grid", width: "100%", fontSize: 13 }}>
          <thead
            style={{
              display: "grid",
              position: "sticky",
              top: 0,
              background: "#f5f5f5",
              zIndex: 1,
            }}
          >
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} style={{ display: "flex", width: "100%" }}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      flex: `${header.getSize()} 0 0`,
                      textAlign: "left",
                      padding: "8px 10px",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* 2. the tbody is as tall as ALL rows would be, so the scrollbar is honest */}
          <tbody style={{ display: "grid", position: "relative", height: rowVirtualizer.getTotalSize() }}>
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                /* 3. each visible row is absolutely positioned at its own offset */
                <tr
                  key={row.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: "flex",
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        flex: `${cell.column.getSize()} 0 0`,
                        padding: "8px 10px",
                        borderBottom: "1px solid #eee",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
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

      <p style={{ fontSize: 12, color: "#888" }}>
        Rendering rows {virtualRows[0]?.index ?? 0}–
        {virtualRows[virtualRows.length - 1]?.index ?? 0} · total height{" "}
        {rowVirtualizer.getTotalSize()}px
      </p>
    </div>
  );
}

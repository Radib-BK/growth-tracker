import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type HeaderGroup,
  type Row,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Lesson, StateReadout, Chip } from "@/demo/table/components/Lesson";
import { flatUsers, fullName, type User } from "@/demo/table/data/users";
import { StatusCell } from "@/demo/table/components/cells";
import { money } from "@/demo/table/components/format";

const col = createColumnHelper<User>();

const columns = [
  col.accessor((u) => fullName(u), { id: "name", header: "Name" }),
  col.accessor("department", { header: "Department" }),
  col.accessor("role", { header: "Role" }),
  col.accessor("status", { header: "Status", cell: (c) => <StatusCell status={c.getValue()} /> }),
  col.accessor("salary", {
    header: "Salary",
    cell: (c) => <span className="tabular-nums">{money(c.getValue())}</span>,
  }),
];

/* ------------------------------------------------------------------ */
/* A. client side paging: the table has all 55 rows and slices them    */
/* ------------------------------------------------------------------ */

function ClientPaging() {
  const table = useReactTable({
    data: flatUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;

  return (
    <div className="space-y-3">
      <BasicTable headerGroups={table.getHeaderGroups()} rows={table.getRowModel().rows} />
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
        <Button size="sm" variant="outline" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>«</Button>
        <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹ Prev</Button>
        <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next ›</Button>
        <Button size="sm" variant="outline" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>»</Button>
        <span>
          Page <b>{pageIndex + 1}</b> of {table.getPageCount()} · {table.getRowCount()} rows
        </span>
        <select
          className="h-8 rounded-md border px-2"
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* B. manual paging: the table is told only about ONE page at a time.  */
/*    Normally the page comes from an API. Here it comes from the same */
/*    local array behind a fake delay, so the behaviour is identical   */
/*    without a backend.                                               */
/* ------------------------------------------------------------------ */

type Page = { rows: User[]; total: number };

/** Stand-in for GET /users?page=…&size=… - same async shape, no network. */
function fetchPage({ pageIndex, pageSize }: PaginationState): Promise<Page> {
  const start = pageIndex * pageSize;
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ rows: flatUsers.slice(start, start + pageSize), total: flatUsers.length }),
      600,
    ),
  );
}

function ManualPaging() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage(pagination).then((p) => {
      if (!cancelled) {
        setPage(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pagination]);

  // While the next page is in flight, keep showing the previous one - the same
  // idea as placeholderData/keepPreviousData in TanStack Query. The rows dim
  // instead of collapsing into a spinner, so the layout never jumps.
  const placeholderRows = useMemo(
    () => Array.from({ length: pagination.pageSize }, () => null),
    [pagination.pageSize],
  );

  const table = useReactTable({
    data: page?.rows ?? [],
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,               // do NOT slice, the data IS the page
    rowCount: page?.total,                // needed for getPageCount()
    getCoreRowModel: getCoreRowModel(),
  });

  const showPlaceholder = loading && !page;

  return (
    <div className="space-y-3">
      <div className={cn("transition-opacity", loading && page && "opacity-50")}>
        {showPlaceholder ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((_, i) => (
                  <TableHead key={i}>&nbsp;</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderRows.map((_, i) => (
                <TableRow key={i}>
                  {columns.map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-4 animate-pulse rounded bg-neutral-200" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <BasicTable headerGroups={table.getHeaderGroups()} rows={table.getRowModel().rows} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
        <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹ Prev</Button>
        <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next ›</Button>
        <span>
          Page <b>{pagination.pageIndex + 1}</b> of {table.getPageCount()} · server says{" "}
          {page?.total ?? "…"} rows
        </span>
        {loading && <Chip tone="amber">loading page…</Chip>}
      </div>
    </div>
  );
}

/**
 * Renders whatever rows it is handed.
 *
 * Note what it does NOT take: the table instance. useReactTable returns the
 * same mutable object on every render, so a memoizing compiler sees an
 * unchanged prop and skips the re-render - the table would freeze on page 1.
 * Pass the derived arrays instead; those are new on every render.
 */
function BasicTable({
  headerGroups,
  rows,
}: {
  headerGroups: HeaderGroup<User>[];
  rows: Row<User>[];
}) {
  return (
    <Table>
      <TableHeader>
        {headerGroups.map((hg) => (
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
  );
}

const clientSnippet = `const table = useReactTable({
  data,                                   // ALL 55 rows
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),   // does the slicing
  initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
});

// everything you need for the controls, already computed:
table.getCanPreviousPage()   // boolean
table.getCanNextPage()       // boolean
table.getPageCount()         // total pages
table.getRowCount()          // rows AFTER filtering
table.firstPage() / previousPage() / nextPage() / lastPage()
table.setPageIndex(3)
table.setPageSize(20)        // resets nothing else - state is independent

// order of operations inside the table:
// data -> filtered -> sorted -> grouped -> expanded -> PAGINATED`;

const manualSnippet = `// Manual mode: you own the slicing (usually because a server does).
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 5,
});
const [page, setPage] = useState<Page | null>(null);
const [loading, setLoading] = useState(true);

// stands in for GET /users?page=&size= - reads the local array behind a
// 600ms delay, so the loading behaviour is real without a backend
useEffect(() => {
  let cancelled = false;
  setLoading(true);
  fetchPage(pagination).then((p) => {
    if (cancelled) return;
    setPage(p);          // keep the OLD page on screen until this lands
    setLoading(false);   // -> the rows dim, they never disappear
  });
  return () => { cancelled = true; };
}, [pagination]);

const table = useReactTable({
  data: page?.rows ?? [],
  columns,
  state: { pagination },
  onPaginationChange: setPagination,
  manualPagination: true,   // "the data I gave you IS the page, do not slice"
  rowCount: page?.total,    // without this getPageCount() cannot exist
  getCoreRowModel: getCoreRowModel(),
});

// skeletons only when there is nothing to show yet
const showPlaceholder = loading && !page;

// With TanStack Query this whole block collapses to one useQuery with
// placeholderData: keepPreviousData - same behaviour, less wiring.
// Same rule for manualSorting / manualFiltering: flip the flag, send the
// state to the server, and drop the matching getXxxRowModel().`;

export default function PaginationLesson() {
  const [pagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  return (
    <Lesson
      title="Pagination"
      tagline="Client side paging is one row model and a state object. Manual paging flips one flag and hands the slicing to whoever owns the data. The rendering code is byte for byte identical - which is the whole argument for doing it this way."
      snippets={[
        { label: "client.ts", code: clientSnippet, highlight: [2, 5, 6] },
        { label: "manual.ts", code: manualSnippet, highlight: [16, 17, 27, 28, 33] },
      ]}
      takeaways={[
        <>Pagination is the <b>last</b> step. Filter and sort run over the full set first, which is why a search can drop you from 6 pages to 1.</>,
        <><code>manualPagination: true</code> without <code>rowCount</code> gives you a page count of -1. That is the number one bug here.</>,
        <>Keep the previous page on screen while the next one loads (<code>placeholderData</code>), and only show skeletons on the very first load.</>,
        <>The pagination state is serialisable - put it in the URL and the page is shareable for free.</>,
      ]}
    >
      <section>
        <h2 className="mb-2 text-sm font-semibold">A · client side ({flatUsers.length} rows in memory)</h2>
        <ClientPaging />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">
          B · manual paging <span className="font-normal text-neutral-500">(same local data, behind a fake 600ms request)</span>
        </h2>
        <ManualPaging />
      </section>

      <StateReadout label="initial pagination state" value={pagination} />
    </Lesson>
  );
}

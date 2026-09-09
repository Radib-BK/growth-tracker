import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Lesson, Chip } from "@/demo/table/components/Lesson";
import { flatUsers, fullName, type User } from "@/demo/table/data/users";
import { PersonCell, StatusCell } from "@/demo/table/components/cells";
import { money, shortDate } from "@/demo/table/components/format";

/**
 * createColumnHelper<User>() exists purely for type inference: it makes
 * cell.getValue() know it is a number for salary and a string for email.
 */
const col = createColumnHelper<User>();

/*
 * Hoisted to module scope on purpose - DO NOT inline `flatUsers.slice(0, 8)`
 * into useReactTable.
 *
 * `.slice()` returns a new array on every render. getCoreRowModel's memo sees
 * a changed `data` reference, fires its onChange, which queues
 * table._autoResetPageIndex() -> resetPageIndex() -> a state update -> another
 * render -> another new array. That is an infinite loop that locks the tab.
 * `data` and `columns` must be referentially stable.
 */
const demoRows = flatUsers.slice(0, 8);


const columns = [
  // 1. display column: no data behind it at all. No accessor -> not sortable,
  //    not filterable, and getValue() is undefined. Pure UI.
  col.display({
    id: "rowNumber",
    header: "#",
    cell: (ctx) => <span className="font-mono text-xs text-neutral-400">{ctx.row.index + 1}</span>,
  }),

  // 2. accessorFn: the value is computed, so sorting/filtering work on the
  //    computed string, not on firstName. id is mandatory here.
  col.accessor((u) => fullName(u), {
    id: "name",
    header: "Person",
    cell: (ctx) => <PersonCell user={ctx.row.original} />,
  }),

  // 3. accessorKey (the common case): key doubles as the column id.
  col.accessor("department", {
    header: "Department",
    footer: () => `${new Set(flatUsers.map((u) => u.department)).size} departments`,
  }),

  col.accessor("status", {
    header: "Status",
    cell: (ctx) => <StatusCell status={ctx.getValue()} />,
  }),

  // 4. cell gets the whole context: value, row, column and the table itself.
  col.accessor("salary", {
    header: () => <span className="block text-right">Salary</span>,
    cell: (ctx) => <span className="block text-right tabular-nums">{money(ctx.getValue())}</span>,
    // footers render from table.getFooterGroups(), same shape as headers
    footer: () => {
      const total = flatUsers.reduce((sum, u) => sum + u.salary, 0);
      return <span className="block text-right tabular-nums">{money(total)}</span>;
    },
  }),

  col.accessor("joinedAt", {
    header: "Joined",
    cell: (ctx) => shortDate(ctx.getValue()),
  }),

  // 5. optional field: accessor returns undefined for most rows, so the cell
  //    renderer is where the fallback lives.
  col.accessor("notes", {
    header: "Notes",
    cell: (ctx) => ctx.getValue() ?? <span className="text-neutral-300">—</span>,
  }),

  // 6. another display column: actions never belong in the data.
  col.display({
    id: "actions",
    header: "",
    cell: () => (
      <Button size="xs" variant="ghost">
        Edit
      </Button>
    ),
  }),
];

const snippet = `const col = createColumnHelper<User>();

const columns = [
  // display column - no data behind it, so no sorting/filtering
  col.display({
    id: "rowNumber",
    header: "#",
    cell: (ctx) => ctx.row.index + 1,
  }),

  // accessorFn - a computed value; id is required
  col.accessor((u) => \`\${u.firstName} \${u.lastName}\`, {
    id: "name",
    header: "Person",
    cell: (ctx) => <PersonCell user={ctx.row.original} />,
  }),

  // accessorKey - the everyday case, key doubles as the column id
  col.accessor("department", { header: "Department" }),

  // header and footer accept a renderer too, not just a string
  col.accessor("salary", {
    header: () => <span className="text-right">Salary</span>,
    cell: (ctx) => money(ctx.getValue()),     // typed as number
    footer: () => money(sumOfEveryRow),
  }),

  // optional data - the fallback belongs in the cell, not in the data
  col.accessor("notes", {
    header: "Notes",
    cell: (ctx) => ctx.getValue() ?? "—",
  }),
];`;

const renderSnippet = `const table = useReactTable({
  data: flatUsers,
  columns,
  getCoreRowModel: getCoreRowModel(),   // the only mandatory row model
});

// header / cell / footer can each be a string, a component or a function,
// so you cannot just render them. flexRender figures out which it is.
<thead>
  {table.getHeaderGroups().map((hg) => (
    <tr key={hg.id}>
      {hg.headers.map((h) => (
        <th key={h.id} colSpan={h.colSpan}>
          {h.isPlaceholder
            ? null
            : flexRender(h.column.columnDef.header, h.getContext())}
        </th>
      ))}
    </tr>
  ))}
</thead>

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
</tbody>

// row.original  -> your untouched User object
// row.id        -> "0", "1", ... or getRowId(user) if you supply one
// cell.getValue() -> the accessor result for that one cell`;

export default function Columns() {
  const table = useReactTable({
    data: demoRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Lesson
      title="Columns and rows"
      tagline="A column definition answers two questions: where does the value come from (the accessor) and how does it look (the renderers). Rows you never define at all - they come from your data array, one row per item."
      snippets={[
        { label: "columns.tsx", code: snippet, highlight: [4, 5, 6, 7, 8, 9, 11, 12, 13, 18, 19] },
        { label: "render.tsx", code: renderSnippet, highlight: [1, 2, 3, 4, 5] },
      ]}
      takeaways={[
        <>Three kinds of column: <code>accessorKey</code>, <code>accessorFn</code> (needs an explicit <code>id</code>) and <code>display</code> (no data, no sorting).</>,
        <>The accessor decides what sorting and filtering see. If you sort a name column that accesses <code>firstName</code>, you sorted by first name - no matter what the cell prints.</>,
        <><code>flexRender</code> exists because a header can be a string, an element, or a function. Never render <code>columnDef.header</code> directly.</>,
        <><b>Keep <code>data</code> and <code>columns</code> referentially stable.</b> Inlining <code>data={"{"}users.slice(0, 8){"}"}</code> hands the table a new array every render, and the core row model's auto-reset queues a state update each time - an infinite loop that locks the tab. Define them outside the component, or wrap in <code>useMemo</code>.</>,
        <>Give <code>getRowId</code> a stable id (<code>row.id.toString()</code>) as soon as you use selection, otherwise ids are array indexes and shift when you sort.</>,
      ]}
    >
      <div className="flex flex-wrap gap-2 text-xs">
        <Chip tone="blue">display</Chip>
        <Chip tone="blue">accessorFn</Chip>
        <Chip tone="blue">accessorKey</Chip>
        <Chip tone="blue">custom header</Chip>
        <Chip tone="blue">footer</Chip>
        <Chip tone="blue">undefined fallback</Chip>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          {table.getFooterGroups().map((fg) => (
            <TableRow key={fg.id}>
              {fg.headers.map((header) => (
                <TableCell key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.footer, header.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableFooter>
      </Table>

      <p className="text-sm text-neutral-500">
        The footer row above is not special markup - it is the same header groups rendered from{" "}
        <code>table.getFooterGroups()</code> with <code>columnDef.footer</code>.
      </p>
    </Lesson>
  );
}
